// AI-Powered Predictive Analytics Service
// Provides intelligent predictions and insights based on attendance patterns

export interface AttendancePrediction {
  prediction: string;
  confidence: number;
  factors: string[];
  recommendation: string;
}

export interface PatternAnalysis {
  pattern: string;
  strength: 'strong' | 'moderate' | 'weak';
  description: string;
  impact: string;
}

// Predict attendance patterns using AI algorithms
export const predictAttendancePatterns = async (
  attendanceData: any[],
  userId: string
): Promise<AttendancePrediction[]> => {
  const predictions: AttendancePrediction[] = [];

  if (!attendanceData || attendanceData.length === 0) {
    return predictions;
  }

  // Analyze late arrival patterns
  const lateArrivals = attendanceData.filter(a => a.status === 'late');
  const lateRate = lateArrivals.length / attendanceData.length;
  
  if (lateRate > 0.2) {
    predictions.push({
      prediction: 'High likelihood of late arrival tomorrow',
      confidence: Math.min(lateRate * 100, 85),
      factors: [
        `Historical late rate: ${(lateRate * 100).toFixed(1)}%`,
        `${lateArrivals.length} late arrivals in recent period`
      ],
      recommendation: 'Consider leaving 15 minutes earlier to improve punctuality'
    });
  }

  // Analyze day-of-week patterns
  const dayPatterns: Record<string, number> = {};
  attendanceData.forEach(record => {
    const day = new Date(record.clock_in).toLocaleDateString('en-US', { weekday: 'long' });
    if (record.status === 'late') {
      dayPatterns[day] = (dayPatterns[day] || 0) + 1;
    }
  });

  const worstDay = Object.entries(dayPatterns)
    .sort(([, a], [, b]) => (b as number) - (a as number))[0];
  
  if (worstDay && worstDay[1] > 2) {
    predictions.push({
      prediction: `Higher late risk on ${worstDay[0]}s`,
      confidence: 75,
      factors: [
        `${worstDay[1]} late arrivals on ${worstDay[0]}s`,
        'Pattern detected in historical data'
      ],
      recommendation: `Plan extra time for ${worstDay[0]} mornings`
    });
  }

  // Analyze hours worked patterns
  const totalHoursSum = attendanceData.reduce((sum, r) => sum + (parseFloat(r.hours_worked) || 0), 0);
  const avgHours = attendanceData.length > 0 ? totalHoursSum / attendanceData.length : 0;
  
  if (avgHours < 7 && avgHours > 0) {
    predictions.push({
      prediction: 'Below average hours worked',
      confidence: 80,
      factors: [
        `Average hours: ${avgHours.toFixed(1)}h per day`,
        'Target: 8 hours per day'
      ],
      recommendation: 'Ensure you clock out after completing full work hours'
    });
  }

  // Analyze attendance consistency
  const attendanceRate = attendanceData.length > 0 
    ? attendanceData.filter(a => a.status !== 'absent').length / attendanceData.length 
    : 0;
  
  if (attendanceRate < 0.9 && attendanceData.length > 0) {
    predictions.push({
      prediction: 'Attendance consistency needs improvement',
      confidence: 85,
      factors: [
        `Attendance rate: ${(attendanceRate * 100).toFixed(1)}%`,
        `${attendanceData.filter(a => a.status === 'absent').length} absent days`
      ],
      recommendation: 'Focus on maintaining consistent attendance'
    });
  }

  return predictions;
};

// Analyze trends and patterns
export const analyzeTrends = async (attendanceData: any[]): Promise<PatternAnalysis[]> => {
  const analyses: PatternAnalysis[] = [];

  if (!attendanceData || attendanceData.length < 7) {
    return analyses;
  }

  // Weekly trend analysis
  const weeklyData = attendanceData.slice(-7);
  const recentLateRate = weeklyData.length > 0 
    ? weeklyData.filter(a => a.status === 'late').length / weeklyData.length 
    : 0;
  const previousWeek = attendanceData.slice(-14, -7);
  const previousLateRate = previousWeek.length > 0 
    ? previousWeek.filter(a => a.status === 'late').length / previousWeek.length 
    : 0;

  if (recentLateRate > previousLateRate * 1.2) {
    analyses.push({
      pattern: 'Increasing late arrivals',
      strength: 'moderate',
      description: `Late arrival rate increased from ${(previousLateRate * 100).toFixed(1)}% to ${(recentLateRate * 100).toFixed(1)}%`,
      impact: 'May affect performance reviews'
    });
  } else if (recentLateRate < previousLateRate * 0.8) {
    analyses.push({
      pattern: 'Improving punctuality',
      strength: 'strong',
      description: `Late arrival rate decreased from ${(previousLateRate * 100).toFixed(1)}% to ${(recentLateRate * 100).toFixed(1)}%`,
      impact: 'Positive trend in attendance behavior'
    });
  }

  // Time-based pattern analysis
  const morningArrivals = attendanceData
    .filter(a => {
      const hour = new Date(a.clock_in).getHours();
      return hour >= 8 && hour <= 9;
    }).length;
  
  const morningRate = morningArrivals / attendanceData.length;
  
  if (morningRate > 0.7) {
    analyses.push({
      pattern: 'Consistent morning arrival',
      strength: 'strong',
      description: `${(morningRate * 100).toFixed(1)}% of arrivals between 8-9 AM`,
      impact: 'Good punctuality pattern'
    });
  }

  return analyses;
};

// Generate AI insights
export const generateInsights = async (
  attendanceData: any[],
  userStats: any
): Promise<string[]> => {
  const insights: string[] = [];

  if (!attendanceData || attendanceData.length === 0) {
    insights.push('Insufficient data for insights. Keep using the system to generate personalized insights.');
    return insights;
  }

  // Calculate metrics
  const totalDays = attendanceData.length;
  const presentDays = attendanceData.filter(a => a.status === 'present' || a.status === 'overtime').length;
  const lateDays = attendanceData.filter(a => a.status === 'late').length;
  const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;
  const totalHoursWorked = attendanceData.reduce((sum, r) => sum + (parseFloat(r.hours_worked) || 0), 0);
  const avgHours = totalDays > 0 ? totalHoursWorked / totalDays : 0;

  // Generate personalized insights
  if (attendanceRate >= 95) {
    insights.push(`🌟 Excellent! Your ${attendanceRate.toFixed(1)}% attendance rate shows outstanding commitment.`);
  } else if (attendanceRate >= 85) {
    insights.push(`✅ Good attendance rate of ${attendanceRate.toFixed(1)}%. Keep up the consistency!`);
  } else {
    insights.push(`📊 Your attendance rate is ${attendanceRate.toFixed(1)}%. Consider improving consistency for better performance.`);
  }

  if (lateDays > 0) {
    const lateRate = (lateDays / totalDays) * 100;
    if (lateRate > 20) {
      insights.push(`⚠️ You've been late ${lateRate.toFixed(1)}% of the time. Consider adjusting your morning routine.`);
    } else if (lateRate > 10) {
      insights.push(`⏰ You've been late ${lateRate.toFixed(1)}% of the time. Small improvements can make a big difference.`);
    }
  }

  if (avgHours < 7) {
    insights.push(`⏱️ Your average work hours (${avgHours.toFixed(1)}h) are below the standard. Ensure you're completing full work days.`);
  } else if (avgHours > 9) {
    insights.push(`🔥 You're working ${avgHours.toFixed(1)}h on average. Great dedication! Remember to maintain work-life balance.`);
  }

  // Best day analysis
  const dayPerformance: Record<string, { present: number; total: number }> = {};
  attendanceData.forEach(record => {
    const day = new Date(record.clock_in).toLocaleDateString('en-US', { weekday: 'long' });
    if (!dayPerformance[day]) {
      dayPerformance[day] = { present: 0, total: 0 };
    }
    dayPerformance[day].total++;
    if (record.status === 'present' || record.status === 'overtime') {
      dayPerformance[day].present++;
    }
  });

  const bestDay = Object.entries(dayPerformance)
    .map(([day, stats]) => ({
      day,
      rate: stats.total > 0 ? (stats.present / stats.total) * 100 : 0
    }))
    .sort((a, b) => b.rate - a.rate)[0];

  if (bestDay && bestDay.rate > 0) {
    insights.push(`📅 Your best attendance day is ${bestDay.day} with ${bestDay.rate.toFixed(1)}% attendance rate.`);
  }

  return insights;
};
