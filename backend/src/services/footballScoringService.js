const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { recalculateTournamentStandings } = require('./standingsService');

/**
 * Calculate the live match clock in minutes based on persisted timing
 */
const calculateLiveMatchClock = (match) => {
  let baseMinute = match.clockMinute || 0;
  if (!match.isClockRunning || !match.clockStartedAt) {
    return {
      minute: baseMinute,
      isRunning: false,
      period: match.currentPeriod || 'SCHEDULED',
    };
  }

  const elapsedMs = Date.now() - new Date(match.clockStartedAt).getTime();
  const elapsedMinutes = Math.floor(elapsedMs / 60000);
  let liveMinute = baseMinute + elapsedMinutes;

  // Regular time caps with added time indication
  if (match.currentPeriod === '1H') {
    liveMinute = Math.max(0, liveMinute);
  } else if (match.currentPeriod === '2H') {
    liveMinute = Math.max(45, liveMinute);
  }

  return {
    minute: liveMinute,
    isRunning: true,
    period: match.currentPeriod,
  };
};

/**
 * Get comprehensive Football Match Centre details
 */
const getFootballMatchDetails = async (matchId) => {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      tournament: { include: { sport: true } },
      venue: true,
      matchTeams: { include: { team: true } },
      scores: { include: { team: true } },
      result: { include: { winnerTeam: true } },
      footballEvents: {
        orderBy: [{ minute: 'asc' }, { createdAt: 'asc' }],
        include: {
          team: true,
          primaryPlayer: true,
          secondaryPlayer: true,
        },
      },
      footballLineups: {
        include: {
          team: true,
          player: true,
        },
      },
      footballStats: {
        include: {
          team: true,
        },
      },
    },
  });

  if (!match) {
    const error = new Error('Match not found');
    error.statusCode = 404;
    throw error;
  }

  const homeTeamRel = match.matchTeams.find((mt) => mt.side === 'HOME');
  const awayTeamRel = match.matchTeams.find((mt) => mt.side === 'AWAY');

  const homeTeam = homeTeamRel?.team || null;
  const awayTeam = awayTeamRel?.team || null;

  // Ensure Stats exist for both teams
  let homeStats = match.footballStats.find((s) => s.teamId === homeTeam?.id);
  let awayStats = match.footballStats.find((s) => s.teamId === awayTeam?.id);

  if (!homeStats && homeTeam) {
    homeStats = {
      teamId: homeTeam.id,
      possession: 50,
      shots: 0,
      shotsOnTarget: 0,
      corners: 0,
      fouls: 0,
      yellowCards: 0,
      redCards: 0,
      offsides: 0,
      saves: 0,
    };
  }
  if (!awayStats && awayTeam) {
    awayStats = {
      teamId: awayTeam.id,
      possession: 50,
      shots: 0,
      shotsOnTarget: 0,
      corners: 0,
      fouls: 0,
      yellowCards: 0,
      redCards: 0,
      offsides: 0,
      saves: 0,
    };
  }

  // Calculate live clock
  const clock = calculateLiveMatchClock(match);

  // Home and Away Lineups
  const homeLineup = match.footballLineups.filter((l) => l.teamId === homeTeam?.id);
  const awayLineup = match.footballLineups.filter((l) => l.teamId === awayTeam?.id);

  // Timeline: sorted chronologically descending or ascending
  const timeline = match.footballEvents.slice().reverse();

  // Get current scores
  const homeScore = match.scores.find((s) => s.teamId === homeTeam?.id)?.scoreValue ?? 0;
  const awayScore = match.scores.find((s) => s.teamId === awayTeam?.id)?.scoreValue ?? 0;

  return {
    match,
    homeTeam,
    awayTeam,
    homeScore,
    awayScore,
    clock,
    timeline,
    events: match.footballEvents,
    lineups: {
      home: {
        starting: homeLineup.filter((l) => l.isStarting),
        bench: homeLineup.filter((l) => !l.isStarting),
      },
      away: {
        starting: awayLineup.filter((l) => l.isStarting),
        bench: awayLineup.filter((l) => !l.isStarting),
      },
    },
    stats: {
      home: homeStats,
      away: awayStats,
    },
  };
};

/**
 * Start or Kickoff the Football match
 */
const startFootballMatch = async (matchId, userId, userRole) => {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { matchTeams: true },
  });

  if (!match) throw { statusCode: 404, message: 'Match not found' };

  // Initialize football statistics for both teams if they do not exist
  for (const mt of match.matchTeams) {
    await prisma.footballMatchStat.upsert({
      where: { matchId_teamId: { matchId, teamId: mt.teamId } },
      update: {},
      create: {
        matchId,
        teamId: mt.teamId,
        possession: 50,
        shots: 0,
        shotsOnTarget: 0,
        corners: 0,
        fouls: 0,
        yellowCards: 0,
        redCards: 0,
        offsides: 0,
        saves: 0,
      },
    });
  }

  // Update match status to LIVE and clock to minute 0
  await prisma.match.update({
    where: { id: matchId },
    data: {
      status: 'LIVE',
      currentPeriod: '1H',
      clockMinute: 0,
      clockStartedAt: new Date(),
      isClockRunning: true,
    },
  });

  // Log Kickoff event
  if (match.matchTeams.length > 0) {
    await prisma.footballMatchEvent.create({
      data: {
        matchId,
        teamId: match.matchTeams[0].teamId,
        eventType: 'PERIOD_START',
        minute: 1,
        period: '1H',
        description: 'First half kicks off!',
      },
    });
  }

  return await getFootballMatchDetails(matchId);
};

/**
 * Update Match Clock (Period changes, pauses, resume)
 */
const updateFootballClock = async (matchId, payload, userId, userRole) => {
  const { action, period, minute, addedTime } = payload;
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) throw { statusCode: 404, message: 'Match not found' };

  const updateData = {};

  if (action === 'PAUSE') {
    const clock = calculateLiveMatchClock(match);
    updateData.isClockRunning = false;
    updateData.clockMinute = clock.minute;
    updateData.clockStartedAt = null;
  } else if (action === 'RESUME') {
    updateData.isClockRunning = true;
    updateData.clockStartedAt = new Date();
  } else if (action === 'SET_PERIOD') {
    updateData.currentPeriod = period;

    if (period === 'HT') {
      // Half time
      updateData.isClockRunning = false;
      updateData.clockMinute = 45;
      updateData.clockStartedAt = null;

      await prisma.footballMatchEvent.create({
        data: {
          matchId,
          teamId: (await prisma.matchTeam.findFirst({ where: { matchId } }))?.teamId || '',
          eventType: 'PERIOD_END',
          minute: 45,
          period: 'HT',
          description: 'Half-time whistle blows.',
        },
      });
    } else if (period === '2H') {
      // Second half start
      updateData.isClockRunning = true;
      updateData.clockMinute = 45;
      updateData.clockStartedAt = new Date();

      await prisma.footballMatchEvent.create({
        data: {
          matchId,
          teamId: (await prisma.matchTeam.findFirst({ where: { matchId } }))?.teamId || '',
          eventType: 'PERIOD_START',
          minute: 46,
          period: '2H',
          description: 'Second half begins.',
        },
      });
    } else if (period === 'ET1') {
      updateData.isClockRunning = true;
      updateData.clockMinute = 90;
      updateData.clockStartedAt = new Date();
    } else if (period === 'FT') {
      updateData.isClockRunning = false;
      updateData.clockMinute = 90;
      updateData.clockStartedAt = null;

      await prisma.footballMatchEvent.create({
        data: {
          matchId,
          teamId: (await prisma.matchTeam.findFirst({ where: { matchId } }))?.teamId || '',
          eventType: 'PERIOD_END',
          minute: 90,
          period: 'FT',
          description: 'Full-time whistle blows.',
        },
      });
    }
  } else if (action === 'SET_MINUTE' && minute !== undefined) {
    updateData.clockMinute = parseInt(minute, 10);
    if (match.isClockRunning) {
      updateData.clockStartedAt = new Date();
    }
  }

  await prisma.match.update({
    where: { id: matchId },
    data: updateData,
  });

  return await getFootballMatchDetails(matchId);
};

/**
 * Record a Football Match Event (Goal, Card, Substitution, etc.)
 */
const recordFootballEvent = async (matchId, payload, userId, userRole) => {
  const {
    teamId,
    eventType, // GOAL, YELLOW_CARD, RED_CARD, SUBSTITUTION, INJURY, COMMENTARY
    minute = 1,
    addedTime = null,
    period = '1H',
    primaryPlayerId = null,
    secondaryPlayerId = null,
    goalType = 'REGULAR', // REGULAR, PENALTY, OWN_GOAL
    cardReason = null,
    description = null,
  } = payload;

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      matchTeams: { include: { team: true } },
      footballEvents: true,
      scores: true,
    },
  });

  if (!match) throw { statusCode: 404, message: 'Match not found' };

  const eventMin = parseInt(minute, 10) || 1;
  const addedMin = addedTime ? parseInt(addedTime, 10) : null;

  // Auto-generate description if omitted
  let eventDesc = description;
  let primaryPlayer = null;
  let secondaryPlayer = null;

  if (primaryPlayerId) {
    primaryPlayer = await prisma.player.findUnique({ where: { id: primaryPlayerId } });
  }
  if (secondaryPlayerId) {
    secondaryPlayer = await prisma.player.findUnique({ where: { id: secondaryPlayerId } });
  }

  const team = match.matchTeams.find((mt) => mt.teamId === teamId)?.team;
  const opponentTeam = match.matchTeams.find((mt) => mt.teamId !== teamId)?.team;

  if (!eventDesc) {
    if (eventType === 'GOAL') {
      if (goalType === 'OWN_GOAL') {
        eventDesc = `OWN GOAL! Unfortunate deflection off ${primaryPlayer?.name || 'defender'} into the net!`;
      } else if (goalType === 'PENALTY') {
        eventDesc = `GOAL! ${primaryPlayer?.name || 'Player'} converts from the penalty spot!`;
      } else {
        eventDesc = `GOAL! Superb finish by ${primaryPlayer?.name || 'Scorer'}${secondaryPlayer ? `, assisted by ${secondaryPlayer.name}` : ''}!`;
      }
    } else if (eventType === 'YELLOW_CARD') {
      eventDesc = `Yellow card shown to ${primaryPlayer?.name || 'Player'}${cardReason ? ` for ${cardReason}` : ''}.`;
    } else if (eventType === 'RED_CARD') {
      eventDesc = `RED CARD! ${primaryPlayer?.name || 'Player'} is sent off${cardReason ? ` for ${cardReason}` : ''}!`;
    } else if (eventType === 'SUBSTITUTION') {
      eventDesc = `Substitution: ${primaryPlayer?.name || 'Player in'} replaces ${secondaryPlayer?.name || 'Player out'}.`;
    } else {
      eventDesc = `${eventType} at minute ${eventMin}'.`;
    }
  }

  // Check for second yellow card
  let isSecondYellow = false;
  if (eventType === 'YELLOW_CARD' && primaryPlayerId) {
    const existingYellow = match.footballEvents.find(
      (e) => e.primaryPlayerId === primaryPlayerId && e.eventType === 'YELLOW_CARD'
    );
    if (existingYellow) {
      isSecondYellow = true;
    }
  }

  await prisma.$transaction(async (tx) => {
    // 1. Create main event
    await tx.footballMatchEvent.create({
      data: {
        matchId,
        teamId,
        eventType,
        minute: eventMin,
        addedTime: addedMin,
        period: period || match.currentPeriod || '1H',
        primaryPlayerId,
        secondaryPlayerId,
        goalType: eventType === 'GOAL' ? goalType : null,
        cardReason,
        description: eventDesc,
      },
    });

    // 2. If Second Yellow: immediately create RED_CARD ejection event
    if (isSecondYellow) {
      await tx.footballMatchEvent.create({
        data: {
          matchId,
          teamId,
          eventType: 'RED_CARD',
          minute: eventMin,
          addedTime: addedMin,
          period: period || match.currentPeriod || '1H',
          primaryPlayerId,
          cardReason: 'Second caution (yellow)',
          description: `Second yellow card! ${primaryPlayer?.name} is dismissed with a red card!`,
        },
      });

      // Update team red cards stat
      await tx.footballMatchStat.upsert({
        where: { matchId_teamId: { matchId, teamId } },
        update: { redCards: { increment: 1 } },
        create: { matchId, teamId, redCards: 1 },
      });
    }

    // 3. Handle Score Update if GOAL
    if (eventType === 'GOAL') {
      // If own goal, score is credited to opponent team!
      const scoringTeamId = goalType === 'OWN_GOAL' ? opponentTeam?.id : teamId;

      if (scoringTeamId) {
        await tx.score.upsert({
          where: { matchId_teamId: { matchId, teamId: scoringTeamId } },
          update: { scoreValue: { increment: 1 } },
          create: {
            matchId,
            teamId: scoringTeamId,
            scoreValue: 1,
            period: 'Live',
          },
        });
      }

      // Update shots / shots on target in stats
      const shotTeamId = goalType === 'OWN_GOAL' ? opponentTeam?.id : teamId;
      if (shotTeamId) {
        await tx.footballMatchStat.upsert({
          where: { matchId_teamId: { matchId, teamId: shotTeamId } },
          update: {
            shots: { increment: 1 },
            shotsOnTarget: { increment: 1 },
          },
          create: {
            matchId,
            teamId: shotTeamId,
            shots: 1,
            shotsOnTarget: 1,
          },
        });
      }
    }

    // 4. Update Stats on Card
    if (eventType === 'YELLOW_CARD') {
      await tx.footballMatchStat.upsert({
        where: { matchId_teamId: { matchId, teamId } },
        update: { yellowCards: { increment: 1 } },
        create: { matchId, teamId, yellowCards: 1 },
      });
    } else if (eventType === 'RED_CARD' && !isSecondYellow) {
      await tx.footballMatchStat.upsert({
        where: { matchId_teamId: { matchId, teamId } },
        update: { redCards: { increment: 1 } },
        create: { matchId, teamId, redCards: 1 },
      });
    }
  });

  return await getFootballMatchDetails(matchId);
};

/**
 * Undo / Delete a Football Match Event
 */
const undoFootballEvent = async (matchId, eventId, userId, userRole) => {
  const event = await prisma.footballMatchEvent.findUnique({
    where: { id: eventId },
    include: { match: { include: { matchTeams: true } } },
  });

  if (!event || event.matchId !== matchId) {
    throw { statusCode: 404, message: 'Event not found' };
  }

  await prisma.$transaction(async (tx) => {
    // If it was a goal, deduct score from credited team
    if (event.eventType === 'GOAL') {
      const opponentTeam = event.match.matchTeams.find((mt) => mt.teamId !== event.teamId);
      const creditedTeamId = event.goalType === 'OWN_GOAL' ? opponentTeam?.teamId : event.teamId;

      if (creditedTeamId) {
        const currentScore = await tx.score.findUnique({
          where: { matchId_teamId: { matchId, teamId: creditedTeamId } },
        });

        if (currentScore && currentScore.scoreValue > 0) {
          await tx.score.update({
            where: { matchId_teamId: { matchId, teamId: creditedTeamId } },
            data: { scoreValue: { decrement: 1 } },
          });
        }
      }
    }

    // Delete event
    await tx.footballMatchEvent.delete({
      where: { id: eventId },
    });
  });

  return await getFootballMatchDetails(matchId);
};

/**
 * Save Starting XI and Substitutes Lineups
 */
const saveFootballLineups = async (matchId, payload, userId, userRole) => {
  const { lineups = [] } = payload; // Array of { teamId, playerId, isStarting, position, jerseyNumber, isCaptain }

  await prisma.$transaction(async (tx) => {
    for (const item of lineups) {
      await tx.footballLineup.upsert({
        where: { matchId_playerId: { matchId, playerId: item.playerId } },
        update: {
          teamId: item.teamId,
          isStarting: item.isStarting,
          position: item.position || 'SUB',
          jerseyNumber: item.jerseyNumber ? parseInt(item.jerseyNumber, 10) : null,
          isCaptain: Boolean(item.isCaptain),
        },
        create: {
          matchId,
          teamId: item.teamId,
          playerId: item.playerId,
          isStarting: item.isStarting,
          position: item.position || 'SUB',
          jerseyNumber: item.jerseyNumber ? parseInt(item.jerseyNumber, 10) : null,
          isCaptain: Boolean(item.isCaptain),
        },
      });
    }
  });

  return await getFootballMatchDetails(matchId);
};

/**
 * Update Match Statistics (Possession, shots, corners, fouls, etc.)
 */
const updateFootballStats = async (matchId, payload, userId, userRole) => {
  const { homeStats, awayStats } = payload;

  await prisma.$transaction(async (tx) => {
    if (homeStats && homeStats.teamId) {
      await tx.footballMatchStat.upsert({
        where: { matchId_teamId: { matchId, teamId: homeStats.teamId } },
        update: {
          possession: parseInt(homeStats.possession, 10) || 50,
          shots: parseInt(homeStats.shots, 10) || 0,
          shotsOnTarget: parseInt(homeStats.shotsOnTarget, 10) || 0,
          corners: parseInt(homeStats.corners, 10) || 0,
          fouls: parseInt(homeStats.fouls, 10) || 0,
          yellowCards: parseInt(homeStats.yellowCards, 10) || 0,
          redCards: parseInt(homeStats.redCards, 10) || 0,
          offsides: parseInt(homeStats.offsides, 10) || 0,
          saves: parseInt(homeStats.saves, 10) || 0,
        },
        create: {
          matchId,
          teamId: homeStats.teamId,
          possession: parseInt(homeStats.possession, 10) || 50,
          shots: parseInt(homeStats.shots, 10) || 0,
          shotsOnTarget: parseInt(homeStats.shotsOnTarget, 10) || 0,
          corners: parseInt(homeStats.corners, 10) || 0,
          fouls: parseInt(homeStats.fouls, 10) || 0,
          yellowCards: parseInt(homeStats.yellowCards, 10) || 0,
          redCards: parseInt(homeStats.redCards, 10) || 0,
          offsides: parseInt(homeStats.offsides, 10) || 0,
          saves: parseInt(homeStats.saves, 10) || 0,
        },
      });
    }

    if (awayStats && awayStats.teamId) {
      await tx.footballMatchStat.upsert({
        where: { matchId_teamId: { matchId, teamId: awayStats.teamId } },
        update: {
          possession: parseInt(awayStats.possession, 10) || 50,
          shots: parseInt(awayStats.shots, 10) || 0,
          shotsOnTarget: parseInt(awayStats.shotsOnTarget, 10) || 0,
          corners: parseInt(awayStats.corners, 10) || 0,
          fouls: parseInt(awayStats.fouls, 10) || 0,
          yellowCards: parseInt(awayStats.yellowCards, 10) || 0,
          redCards: parseInt(awayStats.redCards, 10) || 0,
          offsides: parseInt(awayStats.offsides, 10) || 0,
          saves: parseInt(awayStats.saves, 10) || 0,
        },
        create: {
          matchId,
          teamId: awayStats.teamId,
          possession: parseInt(awayStats.possession, 10) || 50,
          shots: parseInt(awayStats.shots, 10) || 0,
          shotsOnTarget: parseInt(awayStats.shotsOnTarget, 10) || 0,
          corners: parseInt(awayStats.corners, 10) || 0,
          fouls: parseInt(awayStats.fouls, 10) || 0,
          yellowCards: parseInt(awayStats.yellowCards, 10) || 0,
          redCards: parseInt(awayStats.redCards, 10) || 0,
          offsides: parseInt(awayStats.offsides, 10) || 0,
          saves: parseInt(awayStats.saves, 10) || 0,
        },
      });
    }
  });

  return await getFootballMatchDetails(matchId);
};

/**
 * Finalize Football Match and recalculate Tournament Standings
 */
const finalizeFootballMatch = async (matchId, payload = {}, userId, userRole) => {
  const details = await getFootballMatchDetails(matchId);
  const { match, homeTeam, awayTeam, homeScore, awayScore } = details;

  let winnerTeamId = null;
  let resultType = 'DRAW';

  if (homeScore > awayScore) {
    winnerTeamId = homeTeam?.id;
    resultType = 'WIN';
  } else if (awayScore > homeScore) {
    winnerTeamId = awayTeam?.id;
    resultType = 'WIN';
  } else {
    winnerTeamId = null;
    resultType = 'DRAW';
  }

  // Execute in transaction
  await prisma.$transaction(async (tx) => {
    // 1. Update match to COMPLETED
    await tx.match.update({
      where: { id: matchId },
      data: {
        status: 'COMPLETED',
        currentPeriod: 'FT',
        isClockRunning: false,
        clockMinute: 90,
      },
    });

    // 2. Upsert Result
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

    // 3. Update Tournament Standings
    await recalculateTournamentStandings(match.tournamentId, tx);
  });

  return await getFootballMatchDetails(matchId);
};

module.exports = {
  getFootballMatchDetails,
  startFootballMatch,
  updateFootballClock,
  recordFootballEvent,
  undoFootballEvent,
  saveFootballLineups,
  updateFootballStats,
  finalizeFootballMatch,
};

