export interface CallerProfile {
  phoneNumber: string;
  name: string;
  interactionCount: number;
  lastContact: string;
  trustScore: 'High' | 'Medium' | 'Suspicious';
}

class HomeComDatabase {
  private profiles = new Map<string, CallerProfile>();
  private messages: Array<any> = [];

  constructor() {
    // Inject seeding data for sandbox demonstration
    this.profiles.set('+15550199', {
      phoneNumber: '+15550199',
      name: 'Rajesh Kumar',
      interactionCount: 42,
      lastContact: '3 days ago',
      trustScore: 'High'
    });
    this.profiles.set('+15550100', {
      phoneNumber: '+15550100',
      name: 'Unknown Telemarketer',
      interactionCount: 1,
      lastContact: 'Just Now',
      trustScore: 'Suspicious'
    });
  }

  public async getProfile(phone: string): Promise<CallerProfile> {
    if (this.profiles.has(phone)) {
      return this.profiles.get(phone)!;
    }
    return {
      phoneNumber: phone,
      name: 'Unknown Caller',
      interactionCount: 0,
      lastContact: 'Never',
      trustScore: 'Medium'
    };
  }

  public async logMessage(sender: string, receiver: string, text: string) {
    this.messages.push({ sender, receiver, text, timestamp: new Date().toISOString() });
    console.log(`[DB Persistence] Logged message from ${sender}`);
  }
}

export const db = new HomeComDatabase();