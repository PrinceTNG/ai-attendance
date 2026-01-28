import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { scheduleAPI } from '../services/api';

interface ScheduleEntry {
  id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  subject: string;
  description: string;
  location: string;
  applies_to: string;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const DAY_LABELS: Record<string, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun'
};

const FULL_DAY_LABELS: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday'
};

export const WeeklyScheduleView: React.FC = () => {
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string>(() => {
    const today = new Date().getDay();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[today] || 'monday';
  });

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const response = await scheduleAPI.getSchedules();
      if (response.success) {
        setSchedules(response.schedules || []);
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSchedulesForDay = (day: string) => {
    return schedules
      .filter(s => s.day_of_week === day)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  };

  const getCurrentTimeSlot = () => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    return currentTime;
  };

  const isCurrentSlot = (startTime: string, endTime: string) => {
    const now = getCurrentTimeSlot();
    const today = new Date().getDay();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    if (days[today] !== selectedDay) return false;
    
    return now >= startTime && now <= endTime;
  };

  const isUpcoming = (startTime: string) => {
    const now = getCurrentTimeSlot();
    const today = new Date().getDay();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    if (days[today] !== selectedDay) return false;
    
    return startTime > now;
  };

  const isPast = (endTime: string) => {
    const now = getCurrentTimeSlot();
    const today = new Date().getDay();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    if (days[today] !== selectedDay) return false;
    
    return endTime < now;
  };

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-blue-400" />
          Weekly Schedule
        </h3>
      </div>

      {/* Day Selector */}
      <div className="flex items-center justify-center space-x-2 mb-6">
        {DAYS.map((day) => {
          const today = new Date().getDay();
          const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          const isToday = days[today] === day;
          
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedDay === day
                  ? 'bg-blue-500 text-white'
                  : isToday
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {DAY_LABELS[day]}
              {isToday && selectedDay !== day && (
                <span className="ml-1 text-xs">(Today)</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Schedule for Selected Day */}
      <div className="space-y-3">
        <h4 className="text-lg font-medium text-white mb-4">
          {FULL_DAY_LABELS[selectedDay]}'s Schedule
        </h4>
        
        {getSchedulesForDay(selectedDay).length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No scheduled activities for {FULL_DAY_LABELS[selectedDay]}</p>
          </div>
        ) : (
          getSchedulesForDay(selectedDay).map((entry, index) => {
            const isCurrent = isCurrentSlot(entry.start_time, entry.end_time);
            const isNext = isUpcoming(entry.start_time);
            const isDone = isPast(entry.end_time);
            
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-xl border transition-all ${
                  isCurrent
                    ? 'bg-blue-500/20 border-blue-500/50 ring-2 ring-blue-500/30'
                    : isDone
                    ? 'bg-green-500/10 border-green-500/30 opacity-75'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="flex items-center text-sm">
                        <Clock className={`w-4 h-4 mr-1 ${isCurrent ? 'text-blue-400' : isDone ? 'text-green-400' : 'text-gray-400'}`} />
                        <span className={`font-medium ${isCurrent ? 'text-blue-400' : isDone ? 'text-green-400' : 'text-white'}`}>
                          {entry.start_time} - {entry.end_time}
                        </span>
                      </div>
                      {isCurrent && (
                        <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full animate-pulse">
                          Now
                        </span>
                      )}
                      {isDone && (
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                          Completed
                        </span>
                      )}
                      {isNext && !isCurrent && (
                        <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                          Upcoming
                        </span>
                      )}
                    </div>
                    
                    <h5 className={`text-lg font-semibold ${isDone ? 'text-gray-400' : 'text-white'}`}>
                      {entry.subject}
                    </h5>
                    
                    {entry.description && (
                      <p className="text-sm text-gray-400 mt-1">{entry.description}</p>
                    )}
                    
                    <div className="flex items-center mt-2 text-sm text-gray-400">
                      <MapPin className="w-3 h-3 mr-1" />
                      {entry.location}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Quick Summary */}
      {schedules.length > 0 && (
        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-blue-400">
                {getSchedulesForDay(selectedDay).length}
              </p>
              <p className="text-xs text-gray-400">Activities Today</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-400">
                {getSchedulesForDay(selectedDay).filter(s => isPast(s.end_time)).length}
              </p>
              <p className="text-xs text-gray-400">Completed</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
