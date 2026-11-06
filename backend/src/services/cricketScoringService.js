const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { recalculateTournamentStandings } = require('./standingsService');

/**
 * Format legal ball count into Cricket overs notation: e.g. 19 balls -> "3.1"
 */
const formatOvers = (legalBalls) => {
  const overs = Math.floor(legalBalls / 6);
  const balls = legalBalls % 6;
  return `${overs}.${balls}`;
};

/**
 * Convert overs notation (e.g. 3.1) or overs + balls into total legal balls
 */
const toLegalBalls = (overs, balls = 0) => {
  return Math.floor(overs) * 6 + balls;
};

/**
 * Calculate Run Rates
 */
const calculateRunRate = (runs, legalBalls) => {
  if (!legalBalls || legalBalls === 0) return '0.00';
  const overs = legalBalls / 6;
  return (runs / overs).toFixed(2);
};

const calculateRequiredRunRate = (targetRuns, currentRuns, legalBallsRemaining) => {
  if (legalBallsRemaining <= 0) return '0.00';
  const runsNeeded = targetRuns - currentRuns;
  if (runsNeeded <= 0) return '0.00';
  const oversRemaining = legalBallsRemaining / 6;
  return (runsNeeded / oversRemaining).toFixed(2);
};

/**
 * Get complete Cricket match scorecard, ball-by-ball commentary, and live state
 */
const getCricketMatchDetails = async (matchId) => {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      tournament: { include: { sport: true } },
      venue: true,
      matchTeams: { include: { team: true } },
      scores: true,
      result: { include: { winnerTeam: true } },
      cricketInnings: {
        orderBy: { inningsNumber: 'asc' },
        include: {
          battingTeam: true,
          bowlingTeam: true,
          deliveries: {
            orderBy: { createdAt: 'asc' },
            include: {
              bowler: true,
              striker: true,
              nonStriker: true,
              dismissedPlayer: true,
              fielder: true,
            },
          },
        },
      },
    },
  });

  if (!match) {
    const error = new Error('Match not found');
    error.statusCode = 404;
    throw error;
  }

  // Build full ESPN-style scorecard for each innings
  const inningsScorecards = match.cricketInnings.map((innings) => {
    const deliveries = innings.deliveries;

    // 1. Batting figures map
    const battersMap = {};
    // 2. Bowling figures map
    const bowlersMap = {};
    // 3. Fall of wickets
    const fallOfWickets = [];
    // 4. Over by over breakdown
    const oversList = [];
    // 5. Extras breakdown
    let byes = 0;
    let legByes = 0;
    let wides = 0;
    let noBalls = 0;
    let penalty = 0;

    let cumulativeRuns = 0;
    let cumulativeWickets = 0;
    let cumulativeLegalBalls = 0;

    // Track active over
    let currentOverDeliveries = [];
    let currentOverNumber = 0;

    for (const d of deliveries) {
      // Initialize striker in batters map if not present
      if (!battersMap[d.strikerId]) {
        battersMap[d.strikerId] = {
          player: d.striker,
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          dismissal: 'not out',
          isOut: false,
          entryOrder: Object.keys(battersMap).length + 1,
        };
      }
      // Initialize non-striker
      if (!battersMap[d.nonStrikerId]) {
        battersMap[d.nonStrikerId] = {
          player: d.nonStriker,
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          dismissal: 'not out',
          isOut: false,
          entryOrder: Object.keys(battersMap).length + 1,
        };
      }
      // Initialize bowler
      if (!bowlersMap[d.bowlerId]) {
        bowlersMap[d.bowlerId] = {
          player: d.bowler,
          legalBalls: 0,
          maidens: 0,
          runsConceded: 0,
          wickets: 0,
          wides: 0,
          noBalls: 0,
          dots: 0,
          overRuns: 0,
        };
      }

      const bowlerStats = bowlersMap[d.bowlerId];
      const strikerStats = battersMap[d.strikerId];

      // Batting stats: wides don't count as ball faced for batter
      if (d.extrasType !== 'WIDE') {
        strikerStats.balls += 1;
      }
      strikerStats.runs += d.runs;
      if (d.runs === 4 && d.extrasType !== 'WIDE' && d.extrasType !== 'BYE' && d.extrasType !== 'LEG_BYE') {
        strikerStats.fours += 1;
      } else if (d.runs === 6 && d.extrasType !== 'WIDE' && d.extrasType !== 'BYE' && d.extrasType !== 'LEG_BYE') {
        strikerStats.sixes += 1;
      }

      // Extras & Team Score
      let deliveryTotalRuns = d.runs;
      let isLegalBall = true;

      if (d.extrasType === 'WIDE') {
        isLegalBall = false;
        wides += d.extraRuns || 1;
        deliveryTotalRuns += (d.extraRuns || 1);
        bowlerStats.wides += 1;
        bowlerStats.runsConceded += (d.extraRuns || 1) + d.runs;
      } else if (d.extrasType === 'NO_BALL') {
        isLegalBall = false;
        noBalls += d.extraRuns || 1;
        deliveryTotalRuns += (d.extraRuns || 1);
        bowlerStats.noBalls += 1;
        bowlerStats.runsConceded += (d.extraRuns || 1) + d.runs;
      } else if (d.extrasType === 'BYE') {
        byes += d.extraRuns || d.runs;
        deliveryTotalRuns = d.extraRuns || d.runs;
        // Byes not charged to bowler
      } else if (d.extrasType === 'LEG_BYE') {
        legByes += d.extraRuns || d.runs;
        deliveryTotalRuns = d.extraRuns || d.runs;
        // Leg byes not charged to bowler
      } else if (d.extrasType === 'PENALTY') {
        isLegalBall = false;
        penalty += d.extraRuns;
        deliveryTotalRuns = d.extraRuns;
      } else {
        // Normal runs off the bat charged to bowler
        bowlerStats.runsConceded += d.runs;
      }

      if (isLegalBall) {
        cumulativeLegalBalls += 1;
        bowlerStats.legalBalls += 1;
        if (deliveryTotalRuns === 0) {
          bowlerStats.dots += 1;
        }
      }

      cumulativeRuns += deliveryTotalRuns;

      // Handle Wicket
      if (d.isWicket) {
        cumulativeWickets += 1;
        const outPlayerId = d.dismissedPlayerId || d.strikerId;
        const outPlayer = battersMap[outPlayerId];

        let dismissalText = 'out';
        if (d.wicketType === 'BOWLED') {
          dismissalText = `b ${d.bowler?.name || 'Bowler'}`;
          bowlerStats.wickets += 1;
        } else if (d.wicketType === 'CAUGHT') {
          dismissalText = `c ${d.fielder?.name || 'Fielder'} b ${d.bowler?.name || 'Bowler'}`;
          bowlerStats.wickets += 1;
        } else if (d.wicketType === 'LBW') {
          dismissalText = `lbw b ${d.bowler?.name || 'Bowler'}`;
          bowlerStats.wickets += 1;
        } else if (d.wicketType === 'STUMPED') {
          dismissalText = `st ${d.fielder?.name || 'Keeper'} b ${d.bowler?.name || 'Bowler'}`;
          bowlerStats.wickets += 1;
        } else if (d.wicketType === 'HIT_WICKET') {
          dismissalText = `hit wicket b ${d.bowler?.name || 'Bowler'}`;
          bowlerStats.wickets += 1;
        } else if (d.wicketType === 'RUN_OUT') {
          dismissalText = `run out (${d.fielder?.name || 'Fielder'})`;
          // Run outs are not credited to bowler's wickets
        } else if (d.wicketType === 'RETIRED_OUT' || d.wicketType === 'RETIRED_HURT') {
          dismissalText = d.wicketType === 'RETIRED_HURT' ? 'retired hurt' : 'retired out';
        }

        if (outPlayer) {
          outPlayer.isOut = true;
          outPlayer.dismissal = dismissalText;
        }

        fallOfWickets.push({
          wicketNumber: cumulativeWickets,
          score: cumulativeRuns,
          overs: formatOvers(cumulativeLegalBalls),
          player: outPlayer?.player || d.dismissedPlayer || d.striker,
        });
      }

      // Track over details
      if (d.overNumber !== currentOverNumber) {
        if (currentOverDeliveries.length > 0) {
          oversList.push({
            overNumber: currentOverNumber,
            deliveries: currentOverDeliveries,
          });
        }
        currentOverDeliveries = [];
        currentOverNumber = d.overNumber;
      }
      currentOverDeliveries.push(d);
    }

    if (currentOverDeliveries.length > 0) {
      oversList.push({
        overNumber: currentOverNumber,
        deliveries: currentOverDeliveries,
      });
    }

    // Format Batters array
    const battingScorecard = Object.values(battersMap)
      .sort((a, b) => a.entryOrder - b.entryOrder)
      .map((b) => ({
        ...b,
        strikeRate: b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : '0.0',
      }));

    // Format Bowlers array
    const bowlingScorecard = Object.values(bowlersMap).map((bw) => {
      const fullOvers = Math.floor(bw.legalBalls / 6);
      const ballsRemainder = bw.legalBalls % 6;
      const oversFormatted = `${fullOvers}.${ballsRemainder}`;
      const economy = bw.legalBalls > 0 ? ((bw.runsConceded / (bw.legalBalls / 6))).toFixed(2) : '0.00';

      return {
        ...bw,
        overs: oversFormatted,
        economy,
      };
    });

    const totalExtras = byes + legByes + wides + noBalls + penalty;
    const currentRunRate = calculateRunRate(cumulativeRuns, cumulativeLegalBalls);

    // Calculate Current Partnership (runs and balls since last wicket)
    let currentPartnershipRuns = 0;
    let currentPartnershipBalls = 0;
    for (let i = deliveries.length - 1; i >= 0; i--) {
      const del = deliveries[i];
      if (del.isWicket) break;
      currentPartnershipRuns += del.runs + (del.extraRuns || 0);
      if (del.extrasType !== 'WIDE') currentPartnershipBalls += 1;
    }

    return {
      inningsId: innings.id,
      inningsNumber: innings.inningsNumber,
      battingTeam: innings.battingTeam,
      bowlingTeam: innings.bowlingTeam,
      totalRuns: cumulativeRuns,
      totalWickets: cumulativeWickets,
      legalBalls: cumulativeLegalBalls,
      overs: formatOvers(cumulativeLegalBalls),
      oversLimit: innings.oversLimit,
      targetRuns: innings.targetRuns,
      isCompleted: innings.isCompleted,
      isDeclared: innings.isDeclared,
      currentRunRate,
      extras: {
        total: totalExtras,
        byes,
        legByes,
        wides,
        noBalls,
        penalty,
      },
      currentPartnership: {
        runs: currentPartnershipRuns,
        balls: currentPartnershipBalls,
      },
      battingScorecard,
      bowlingScorecard,
      fallOfWickets,
      commentary: deliveries.slice().reverse(), // Latest first for commentary
    };
  });

  // Active / Current Innings
  const currentInnings = inningsScorecards[inningsScorecards.length - 1] || null;

  // Active Striker, Non-striker, Bowler objects
  let activeStriker = null;
  let activeNonStriker = null;
  let activeBowler = null;

  if (match.currentStrikerId && currentInnings) {
    activeStriker = currentInnings.battingScorecard.find((b) => b.player.id === match.currentStrikerId) || null;
  }
  if (match.currentNonStrikerId && currentInnings) {
    activeNonStriker = currentInnings.battingScorecard.find((b) => b.player.id === match.currentNonStrikerId) || null;
  }
  if (match.currentBowlerId && currentInnings) {
    activeBowler = currentInnings.bowlingScorecard.find((bw) => bw.player.id === match.currentBowlerId) || null;
  }

  // Calculate Required Run Rate if 2nd innings
  let requiredRunRate = null;
  let runsNeeded = null;
  let ballsRemaining = null;

  if (currentInnings && currentInnings.targetRuns) {
    const totalBallsMatch = currentInnings.oversLimit * 6;
    ballsRemaining = Math.max(0, totalBallsMatch - currentInnings.legalBalls);
    runsNeeded = Math.max(0, currentInnings.targetRuns - currentInnings.totalRuns);
    requiredRunRate = calculateRequiredRunRate(currentInnings.targetRuns, currentInnings.totalRuns, ballsRemaining);
  }

  return {
    match,
    currentInnings,
    inningsScorecards,
    liveState: {
      activeStriker,
      activeNonStriker,
      activeBowler,
      runsNeeded,
      ballsRemaining,
      requiredRunRate,
    },
  };
};

/**
 * Start a Cricket Innings
 */
const startCricketInnings = async (matchId, payload, userId, userRole) => {
  const { battingTeamId, bowlingTeamId, strikerId, nonStrikerId, bowlerId, oversLimit = 20, targetRuns } = payload;

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      tournament: true,
      cricketInnings: { orderBy: { inningsNumber: 'desc' } },
    },
  });

  if (!match) throw { statusCode: 404, message: 'Match not found' };

  // Determine innings number
  const nextInningsNumber = match.cricketInnings.length + 1;

  // Compute targetRuns automatically if 2nd innings and not supplied
  let calculatedTarget = targetRuns;
  if (!calculatedTarget && nextInningsNumber === 2 && match.cricketInnings.length >= 1) {
    calculatedTarget = match.cricketInnings[0].totalRuns + 1;
  }

  const innings = await prisma.cricketInnings.create({
    data: {
      matchId,
      inningsNumber: nextInningsNumber,
      battingTeamId,
      bowlingTeamId,
      oversLimit: parseInt(oversLimit, 10) || 20,
      targetRuns: calculatedTarget ? parseInt(calculatedTarget, 10) : null,
    },
  });

  // Update match live state
  await prisma.match.update({
    where: { id: matchId },
    data: {
      status: 'LIVE',
      currentPeriod: `INNINGS_${nextInningsNumber}`,
      currentStrikerId: strikerId || null,
      currentNonStrikerId: nonStrikerId || null,
      currentBowlerId: bowlerId || null,
      currentInningsId: innings.id,
    },
  });

  return await getCricketMatchDetails(matchId);
};

/**
 * Record a Cricket Delivery (Ball-by-Ball)
 */
const recordCricketDelivery = async (matchId, payload, userId, userRole) => {
  const {
    runs = 0,
    extrasType = null, // WIDE, NO_BALL, BYE, LEG_BYE, PENALTY
    extraRuns = 0,
    isWicket = false,
    wicketType = null, // BOWLED, CAUGHT, LBW, RUN_OUT, STUMPED, HIT_WICKET, RETIRED_HURT, etc.
    dismissedPlayerId = null,
    fielderId = null,
    newBatterId = null,
    newBowlerId = null,
    customCommentary = null,
  } = payload;

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      cricketInnings: {
        where: { isCompleted: false },
        orderBy: { inningsNumber: 'desc' },
        take: 1,
        include: {
          deliveries: { orderBy: { createdAt: 'desc' }, take: 1 },
          battingTeam: true,
          bowlingTeam: true,
        },
      },
      matchTeams: true,
    },
  });

  if (!match) throw { statusCode: 404, message: 'Match not found' };
  const currentInnings = match.cricketInnings[0];
  if (!currentInnings) {
    throw { statusCode: 400, message: 'No active cricket innings found. Please start an innings first.' };
  }

  const strikerId = match.currentStrikerId;
  const nonStrikerId = match.currentNonStrikerId;
  const bowlerId = match.currentBowlerId;

  if (!strikerId || !nonStrikerId || !bowlerId) {
    throw { statusCode: 400, message: 'Active striker, non-striker, and bowler must be selected.' };
  }

  // Calculate legal delivery vs extra
  const isLegal = extrasType !== 'WIDE' && extrasType !== 'NO_BALL' && extrasType !== 'PENALTY';
  const runsOffBat = parseInt(runs, 10) || 0;
  const extraRunsVal = parseInt(extraRuns, 10) || 0;

  let totalDeliveryRuns = runsOffBat;
  if (extrasType === 'WIDE' || extrasType === 'NO_BALL') {
    totalDeliveryRuns += (extraRunsVal > 0 ? extraRunsVal : 1);
  } else if (extrasType === 'BYE' || extrasType === 'LEG_BYE' || extrasType === 'PENALTY') {
    totalDeliveryRuns += extraRunsVal;
  }

  // Current over number and sequence
  const currentLegalBalls = currentInnings.totalLegalBalls;
  const overNumber = Math.floor(currentLegalBalls / 6);
  const ballInOver = (currentLegalBalls % 6) + (isLegal ? 1 : 0);
  const newTotalLegalBalls = currentLegalBalls + (isLegal ? 1 : 0);

  // Fetch player details for automated commentary
  const [bowler, striker, fielder, dismissedPlayer] = await Promise.all([
    prisma.player.findUnique({ where: { id: bowlerId } }),
    prisma.player.findUnique({ where: { id: strikerId } }),
    fielderId ? prisma.player.findUnique({ where: { id: fielderId } }) : null,
    dismissedPlayerId ? prisma.player.findUnique({ where: { id: dismissedPlayerId } }) : null,
  ]);

  // Generate automated commentary
  const overBallStr = `${Math.floor(newTotalLegalBalls / 6)}.${newTotalLegalBalls % 6}`;
  let commentaryText = customCommentary;

  if (!commentaryText) {
    if (isWicket) {
      if (wicketType === 'BOWLED') {
        commentaryText = `OUT! Bowled! ${bowler?.name} breaches ${striker?.name}'s defense, timber!`;
      } else if (wicketType === 'CAUGHT') {
        commentaryText = `OUT! Caught by ${fielder?.name || 'fielder'}! ${striker?.name} miscues the shot off ${bowler?.name}.`;
      } else if (wicketType === 'LBW') {
        commentaryText = `OUT! LBW! Trapped right in front of the stumps by ${bowler?.name}!`;
      } else if (wicketType === 'RUN_OUT') {
        commentaryText = `OUT! Run out! Direct hit or quick work by ${fielder?.name || 'fielder'} finds ${dismissedPlayer?.name || 'batter'} short of crease!`;
      } else {
        commentaryText = `OUT! ${wicketType} - ${striker?.name} departs!`;
      }
    } else if (extrasType === 'WIDE') {
      commentaryText = `Wide ball by ${bowler?.name}, sprayed down leg.`;
    } else if (extrasType === 'NO_BALL') {
      commentaryText = `No-ball called! Overstepping by ${bowler?.name}. Free hit next!`;
    } else if (runsOffBat === 4) {
      commentaryText = `FOUR! Glorious stroke by ${striker?.name} through the gap to the boundary fence!`;
    } else if (runsOffBat === 6) {
      commentaryText = `SIX! Clears the ropes with authority! Monster hit from ${striker?.name}!`;
    } else if (runsOffBat === 0) {
      commentaryText = `Good dot ball from ${bowler?.name}, defended solid by ${striker?.name}.`;
    } else {
      commentaryText = `${runsOffBat} run(s). ${bowler?.name} to ${striker?.name}, worked into the gap for a ${runsOffBat === 1 ? 'single' : 'run'}.`;
    }
  }

  // Strike rotation calculation
  let nextStrikerId = strikerId;
  let nextNonStrikerId = nonStrikerId;
  let nextBowlerId = bowlerId;

  // On odd runs, batsmen cross
  const physicalRuns = (runsOffBat > 0 ? runsOffBat : (extrasType === 'BYE' || extrasType === 'LEG_BYE' ? extraRunsVal : 0));
  if (physicalRuns % 2 === 1) {
    nextStrikerId = nonStrikerId;
    nextNonStrikerId = strikerId;
  }

  // If wicket fell, handle who was out
  if (isWicket && newBatterId) {
    if (dismissedPlayerId === nonStrikerId) {
      nextNonStrikerId = newBatterId;
    } else {
      nextStrikerId = newBatterId;
    }
  }

  // End of over check: 6 legal balls reached
  const isOverComplete = isLegal && (newTotalLegalBalls % 6 === 0);
  if (isOverComplete) {
    // End of over: batsmen switch strike
    const temp = nextStrikerId;
    nextStrikerId = nextNonStrikerId;
    nextNonStrikerId = temp;
    // Next bowler must be different
    if (newBowlerId) {
      nextBowlerId = newBowlerId;
    }
  }

  // Execute in Database Transaction
  await prisma.$transaction(async (tx) => {
    // 1. Create Delivery record
    await tx.cricketDelivery.create({
      data: {
        inningsId: currentInnings.id,
        overNumber,
        ballInOver,
        legalBallNumber: newTotalLegalBalls,
        bowlerId,
        strikerId,
        nonStrikerId,
        runs: runsOffBat,
        extrasType: extrasType || null,
        extraRuns: extraRunsVal,
        isWicket: Boolean(isWicket),
        wicketType: isWicket ? (wicketType || 'BOWLED') : null,
        dismissedPlayerId: isWicket ? (dismissedPlayerId || strikerId) : null,
        fielderId: fielderId || null,
        commentary: commentaryText,
      },
    });

    // 2. Update Innings totals
    const updatedInnings = await tx.cricketInnings.update({
      where: { id: currentInnings.id },
      data: {
        totalRuns: { increment: totalDeliveryRuns },
        totalWickets: isWicket ? { increment: 1 } : undefined,
        totalLegalBalls: isLegal ? { increment: 1 } : undefined,
        byes: extrasType === 'BYE' ? { increment: extraRunsVal || runsOffBat } : undefined,
        legByes: extrasType === 'LEG_BYE' ? { increment: extraRunsVal || runsOffBat } : undefined,
        wides: extrasType === 'WIDE' ? { increment: extraRunsVal || 1 } : undefined,
        noBalls: extrasType === 'NO_BALL' ? { increment: extraRunsVal || 1 } : undefined,
        penaltyRuns: extrasType === 'PENALTY' ? { increment: extraRunsVal } : undefined,
      },
    });

    // 3. Update Match Score record so general tournament views stay live
    const newTotalRuns = currentInnings.totalRuns + totalDeliveryRuns;
    const newTotalWickets = currentInnings.totalWickets + (isWicket ? 1 : 0);
    const newOversStr = formatOvers(newTotalLegalBalls);

    await tx.score.upsert({
      where: { matchId_teamId: { matchId, teamId: currentInnings.battingTeamId } },
      update: {
        scoreValue: newTotalRuns,
        period: `${newOversStr} ov`,
        details: `${newTotalRuns}/${newTotalWickets} (${newOversStr} ov)`,
      },
      create: {
        matchId,
        teamId: currentInnings.battingTeamId,
        scoreValue: newTotalRuns,
        period: `${newOversStr} ov`,
        details: `${newTotalRuns}/${newTotalWickets} (${newOversStr} ov)`,
      },
    });

    // 4. Update Match current players
    await tx.match.update({
      where: { id: matchId },
      data: {
        currentStrikerId: nextStrikerId,
        currentNonStrikerId: nextNonStrikerId,
        currentBowlerId: nextBowlerId,
      },
    });

    // Check if target was chased down (2nd innings win)
    if (updatedInnings.targetRuns && updatedInnings.totalRuns >= updatedInnings.targetRuns) {
      await tx.cricketInnings.update({
        where: { id: currentInnings.id },
        data: { isCompleted: true },
      });
    }
  });

  return await getCricketMatchDetails(matchId);
};

/**
 * Undo the Last Delivery
 */
const undoLastCricketDelivery = async (matchId, userId, userRole) => {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      cricketInnings: {
        orderBy: { inningsNumber: 'desc' },
        take: 1,
        include: {
          deliveries: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      },
    },
  });

  if (!match) throw { statusCode: 404, message: 'Match not found' };
  const currentInnings = match.cricketInnings[0];
  if (!currentInnings || currentInnings.deliveries.length === 0) {
    throw { statusCode: 400, message: 'No delivery to undo.' };
  }

  const lastDelivery = currentInnings.deliveries[0];
  const isLegal = lastDelivery.extrasType !== 'WIDE' && lastDelivery.extrasType !== 'NO_BALL' && lastDelivery.extrasType !== 'PENALTY';

  let totalDeliveryRuns = lastDelivery.runs;
  if (lastDelivery.extrasType === 'WIDE' || lastDelivery.extrasType === 'NO_BALL') {
    totalDeliveryRuns += (lastDelivery.extraRuns > 0 ? lastDelivery.extraRuns : 1);
  } else if (lastDelivery.extrasType === 'BYE' || lastDelivery.extrasType === 'LEG_BYE' || lastDelivery.extrasType === 'PENALTY') {
    totalDeliveryRuns += lastDelivery.extraRuns;
  }

  await prisma.$transaction(async (tx) => {
    // 1. Delete the delivery
    await tx.cricketDelivery.delete({
      where: { id: lastDelivery.id },
    });

    // 2. Decrement Innings totals
    const newTotalRuns = Math.max(0, currentInnings.totalRuns - totalDeliveryRuns);
    const newTotalWickets = Math.max(0, currentInnings.totalWickets - (lastDelivery.isWicket ? 1 : 0));
    const newLegalBalls = Math.max(0, currentInnings.totalLegalBalls - (isLegal ? 1 : 0));

    await tx.cricketInnings.update({
      where: { id: currentInnings.id },
      data: {
        totalRuns: newTotalRuns,
        totalWickets: newTotalWickets,
        totalLegalBalls: newLegalBalls,
        isCompleted: false,
      },
    });

    // 3. Revert Score on Match
    const newOversStr = formatOvers(newLegalBalls);
    await tx.score.upsert({
      where: { matchId_teamId: { matchId, teamId: currentInnings.battingTeamId } },
      update: {
        scoreValue: newTotalRuns,
        period: `${newOversStr} ov`,
        details: `${newTotalRuns}/${newTotalWickets} (${newOversStr} ov)`,
      },
      create: {
        matchId,
        teamId: currentInnings.battingTeamId,
        scoreValue: newTotalRuns,
        period: `${newOversStr} ov`,
        details: `${newTotalRuns}/${newTotalWickets} (${newOversStr} ov)`,
      },
    });

    // 4. Restore original Striker, Non-striker, Bowler
    await tx.match.update({
      where: { id: matchId },
      data: {
        currentStrikerId: lastDelivery.strikerId,
        currentNonStrikerId: lastDelivery.nonStrikerId,
        currentBowlerId: lastDelivery.bowlerId,
      },
    });
  });

  return await getCricketMatchDetails(matchId);
};

/**
 * Switch Active Striker or Bowler manually
 */
const updateCricketActivePlayers = async (matchId, payload, userId, userRole) => {
  const { strikerId, nonStrikerId, bowlerId } = payload;

  await prisma.match.update({
    where: { id: matchId },
    data: {
      currentStrikerId: strikerId || undefined,
      currentNonStrikerId: nonStrikerId || undefined,
      currentBowlerId: bowlerId || undefined,
    },
  });

  return await getCricketMatchDetails(matchId);
};

/**
 * End Cricket Innings (e.g. all out, overs complete, declared)
 */
const endCricketInnings = async (matchId, payload = {}, userId, userRole) => {
  const { isDeclared = false } = payload;

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      cricketInnings: { orderBy: { inningsNumber: 'desc' }, take: 1 },
    },
  });

  if (!match || match.cricketInnings.length === 0) {
    throw { statusCode: 400, message: 'No active cricket innings.' };
  }

  const currentInnings = match.cricketInnings[0];
  await prisma.cricketInnings.update({
    where: { id: currentInnings.id },
    data: {
      isCompleted: true,
      isDeclared: Boolean(isDeclared),
    },
  });

  await prisma.match.update({
    where: { id: matchId },
    data: {
      currentPeriod: `INNINGS_${currentInnings.inningsNumber}_BREAK`,
    },
  });

  return await getCricketMatchDetails(matchId);
};

/**
 * Finalize Cricket Match and recalculate Tournament Standings
 */
const finalizeCricketMatch = async (matchId, payload = {}, userId, userRole) => {
  const details = await getCricketMatchDetails(matchId);
  const { match, inningsScorecards } = details;

  if (inningsScorecards.length < 2) {
    // If only 1 innings completed, check if winner forced
    if (!payload.winnerTeamId) {
      throw { statusCode: 400, message: 'Both innings must be concluded to calculate winner, or specify winnerTeamId manually.' };
    }
  }

  let winnerTeamId = payload.winnerTeamId || null;
  let resultType = 'WIN';
  let summaryDetails = payload.details || '';

  if (!winnerTeamId && inningsScorecards.length >= 2) {
    const inn1 = inningsScorecards[0];
    const inn2 = inningsScorecards[1];

    if (inn2.totalRuns > inn1.totalRuns) {
      winnerTeamId = inn2.battingTeam.id;
      resultType = 'WIN';
      const wicketsRemaining = 10 - inn2.totalWickets;
      summaryDetails = `${inn2.battingTeam.name} won by ${wicketsRemaining} wicket${wicketsRemaining > 1 ? 's' : ''}`;
    } else if (inn1.totalRuns > inn2.totalRuns) {
      winnerTeamId = inn1.battingTeam.id;
      resultType = 'WIN';
      const runDiff = inn1.totalRuns - inn2.totalRuns;
      summaryDetails = `${inn1.battingTeam.name} won by ${runDiff} run${runDiff > 1 ? 's' : ''}`;
    } else {
      winnerTeamId = null;
      resultType = 'TIE';
      summaryDetails = 'Match Tied';
    }
  }

  // Execute in transaction
  await prisma.$transaction(async (tx) => {
    // 1. Mark match completed
    await tx.match.update({
      where: { id: matchId },
      data: {
        status: 'COMPLETED',
        currentPeriod: 'COMPLETED',
      },
    });

    // 2. Mark any open innings as completed
    await tx.cricketInnings.updateMany({
      where: { matchId, isCompleted: false },
      data: { isCompleted: true },
    });

    // 3. Upsert Result
    await tx.result.upsert({
      where: { matchId },
      update: {
        winnerTeamId,
        resultType,
        completedAt: new Date(),
      },
      create: {
        matchId,
        winnerTeamId,
        resultType,
        completedAt: new Date(),
      },
    });

    // 4. Update standings in real-time
    await recalculateTournamentStandings(match.tournamentId, tx);
  });

  return await getCricketMatchDetails(matchId);
};

module.exports = {
  getCricketMatchDetails,
  startCricketInnings,
  recordCricketDelivery,
  undoLastCricketDelivery,
  updateCricketActivePlayers,
  endCricketInnings,
  finalizeCricketMatch,
};

