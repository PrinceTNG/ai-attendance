// AI Helper Utilities
// Provides common AI-related helper functions

// Format AI confidence score
export const formatConfidence = (confidence: number): string => {
  if (confidence >= 0.9) return 'Very High';
  if (confidence >= 0.7) return 'High';
  if (confidence >= 0.5) return 'Medium';
  return 'Low';
};

// Get confidence color
export const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 0.9) return 'text-green-400';
  if (confidence >= 0.7) return 'text-blue-400';
  if (confidence >= 0.5) return 'text-yellow-400';
  return 'text-red-400';
};

// Format AI response with markdown-like styling
export const formatAIResponse = (text: string): React.ReactNode => {
  const lines = text.split('\n');
  return lines.map((line, index) => {
    // Bold text
    if (line.startsWith('**') && line.endsWith('**')) {
      return <strong key={index} className="text-blue-400">{line.slice(2, -2)}</strong>;
    }
    // Bullet points
    if (line.startsWith('•') || line.startsWith('-')) {
      return <div key={index} className="ml-4">{line}</div>;
    }
    // Headers
    if (line.startsWith('#')) {
      const level = line.match(/^#+/)?.[0].length || 1;
      const content = line.replace(/^#+\s*/, '');
      const className = level === 1 ? 'text-xl font-bold' : level === 2 ? 'text-lg font-semibold' : 'text-base font-medium';
      return <div key={index} className={`${className} text-white mt-2`}>{content}</div>;
    }
    return <div key={index}>{line || <br />}</div>;
  });
};

// Calculate AI processing time estimate
export const estimateAIProcessingTime = (complexity: 'simple' | 'medium' | 'complex'): number => {
  const times = {
    simple: 500,
    medium: 1500,
    complex: 3000
  };
  return times[complexity];
};

// Validate face descriptor
export const validateFaceDescriptor = (descriptor: number[]): boolean => {
  if (!Array.isArray(descriptor)) return false;
  if (descriptor.length !== 128) return false;
  if (descriptor.some(val => isNaN(val) || !isFinite(val))) return false;
  return true;
};

// Generate AI summary
export const generateAISummary = (data: any[]): string => {
  if (!data || data.length === 0) {
    return 'No data available for analysis.';
  }

  const total = data.length;
  const present = data.filter(d => d.status === 'present' || d.status === 'overtime').length;
  const late = data.filter(d => d.status === 'late').length;
  const attendanceRate = (present / total) * 100;

  return `AI Analysis: ${total} records analyzed. Attendance rate: ${attendanceRate.toFixed(1)}%. ${late > 0 ? `${late} late arrivals detected.` : 'No late arrivals.'}`;
};
