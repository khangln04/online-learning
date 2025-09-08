import * as signalR from '@microsoft/signalr';

class SignalRService {
  constructor() {
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl('https://localhost:5000/notification-hub', {
        accessTokenFactory: () => {
          const token = localStorage.getItem('token');
          return token;
        },
      })
      .withAutomaticReconnect([0, 2000, 10000, 30000])
      .configureLogging(signalR.LogLevel.None)
      .build();

    // Setup connection event handlers
    this.connection.onclose((error) => {
      // Silent handling
    });

    this.connection.onreconnecting((error) => {
      // Silent handling
    });

    this.connection.onreconnected((connectionId) => {
      // Silent handling
    });
  }

  async start() {
    if (this.connection.state === signalR.HubConnectionState.Connected) {
      return;
    }

    try {
      await this.connection.start();
    } catch (err) {
      // Silent retry after 5 seconds
      setTimeout(() => this.start(), 5000);
    }
  }

  onReceiveComment(callback) {
    this.connection.on('ReceiveComment', (comment) => {
      callback(comment);
    });
  }

  onStatusUpdate(callback) {
    this.connection.on('StatusUpdate', (updatedReport) => {
      callback(updatedReport);
    });
  }

  async joinReportGroup(reportId) {
    const maxRetries = 5;
    let retries = 0;
    
    const attemptJoin = async () => {
      if (this.connection.state === signalR.HubConnectionState.Connected) {
        try {
          await this.connection.invoke('JoinReportGroup', parseInt(reportId));
          return true;
        } catch (err) {
          return false;
        }
      } else {
        retries++;
        
        if (retries < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms
          return attemptJoin();
        } else {
          return false;
        }
      }
    };
    
    return attemptJoin();
  }

  async joinUserGroup(userId) {
    if (this.connection.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke('JoinUserGroup', userId);
    }
  }

  async leaveReportGroup(reportId) {
    if (this.connection.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke('LeaveReportGroup', reportId);
    }
  }

  async stop() {
    if (this.connection) {
      try {
        await this.connection.stop();
      } catch (err) {
        // Silent error handling
      }
    }
  }
}

export default SignalRService;