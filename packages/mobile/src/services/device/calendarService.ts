import RNCalendarEvents, { 
  CalendarEventReadable, 
  Calendar
} from 'react-native-calendar-events';
import { Platform } from 'react-native';

interface PracticeEvent {
  title: string;
  startDate: Date;
  endDate: Date;
  notes?: string;
  location?: string;
  alarms?: { date: number }[]; // Minutes before event
}

class CalendarService {
  private calendarName = 'SpeakBetter AI Coach';
  private primaryCalendarId: string | null = null;
  
  /**
   * Initialize calendar service and request permissions
   */
  async initialize(): Promise<boolean> {
    try {
      // Request calendar permissions
      const authStatus = await RNCalendarEvents.requestPermissions();
      
      if (authStatus !== 'authorized') {
        return false;
      }
      
      // Find or create SpeakBetter calendar
      await this.findOrCreateCalendar();
      
      return true;
    } catch (error) {
      console.error('Error initializing calendar service:', error);
      return false;
    }
  }
  
  /**
   * Find existing SpeakBetter calendar or create a new one
   */
  private async findOrCreateCalendar(): Promise<void> {
    try {
      // Get available calendars
      const calendars = await RNCalendarEvents.findCalendars();
      
      // Look for existing SpeakBetter calendar
      const speakBetterCalendar = calendars.find(cal => cal.title === this.calendarName);
      
      if (speakBetterCalendar) {
        this.primaryCalendarId = speakBetterCalendar.id;
        return;
      }
      
      // If no calendar exists, create one on iOS
      // Android doesn't support calendar creation via the API
      if (Platform.OS === 'ios') {
        const newCalendarId = await RNCalendarEvents.saveCalendar({
          title: this.calendarName,
          color: '#4A55A2', // SpeakBetter primary color
          entityType: 'event',
          source: {
            name: 'SpeakBetter',
            isLocalAccount: true,
          },
        });
        
        this.primaryCalendarId = newCalendarId;
      } else {
        // On Android, use the default calendar
        const defaultCalendar = calendars.find(cal => cal.isPrimary);
        if (defaultCalendar) {
          this.primaryCalendarId = defaultCalendar.id;
        } else if (calendars.length > 0) {
          this.primaryCalendarId = calendars[0].id;
        }
      }
    } catch (error) {
      console.error('Error finding or creating calendar:', error);
      throw error;
    }
  }
  
  /**
   * Schedule a practice session in the calendar
   */
  async schedulePracticeSession(event: PracticeEvent): Promise<string | null> {
    try {
      if (!this.primaryCalendarId) {
        const initialized = await this.initialize();
        if (!initialized || !this.primaryCalendarId) {
          throw new Error('Calendar not initialized');
        }
      }
      
      // Default 15-minute reminder if none provided
      const alarms = event.alarms || [{ date: -15 }];
      
      // Create event
      const eventId = await RNCalendarEvents.saveEvent(event.title, {
        calendarId: this.primaryCalendarId,
        startDate: event.startDate.toISOString(),
        endDate: event.endDate.toISOString(),
        notes: event.notes || 'Practice session scheduled by SpeakBetter AI Coach',
        location: event.location,
        alarms: alarms,
        timeZone: event.timeZone,
      });
      
      return eventId;
    } catch (error) {
      console.error('Error scheduling practice session:', error);
      return null;
    }
  }
  
  /**
   * Get upcoming practice sessions
   */
  async getUpcomingPracticeSessionEvents(days: number = 7): Promise<CalendarEventReadable[]> {
    try {
      if (!this.primaryCalendarId) {
        const initialized = await this.initialize();
        if (!initialized || !this.primaryCalendarId) {
          throw new Error('Calendar not initialized');
        }
      }
      
      // Calculate date range
      const now = new Date();
      const endDate = new Date();
      endDate.setDate(now.getDate() + days);
      
      // Fetch events
      const events = await RNCalendarEvents.fetchAllEvents(
        now.toISOString(),
        endDate.toISOString(),
        [this.primaryCalendarId]
      );
      
      return events;
    } catch (error) {
      console.error('Error getting upcoming practice sessions:', error);
      return [];
    }
  }
  
  /**
   * Delete a calendar event
   */
  async deletePracticeSession(eventId: string): Promise<boolean> {
    try {
      await RNCalendarEvents.removeEvent(eventId);
      return true;
    } catch (error) {
      console.error('Error deleting practice session:', error);
      return false;
    }
  }
  
  /**
   * Update an existing calendar event
   */
  async updatePracticeSession(
    eventId: string, 
    event: Partial<PracticeEvent>
  ): Promise<boolean> {
    try {
      if (!this.primaryCalendarId) {
        const initialized = await this.initialize();
        if (!initialized || !this.primaryCalendarId) {
          throw new Error('Calendar not initialized');
        }
      }
      
      const eventDetails: any = {
        calendarId: this.primaryCalendarId,
      };
      
      // Add fields that need to be updated
      if (event.title) eventDetails.title = event.title;
      if (event.startDate) eventDetails.startDate = event.startDate.toISOString();
      if (event.endDate) eventDetails.endDate = event.endDate.toISOString();
      if (event.notes) eventDetails.notes = event.notes;
      if (event.location) eventDetails.location = event.location;
      if (event.alarms) eventDetails.alarms = event.alarms;
      
      await RNCalendarEvents.saveEvent(eventId, eventDetails);
      return true;
    } catch (error) {
      console.error('Error updating practice session:', error);
      return false;
    }
  }
}

export const calendarService = new CalendarService();
