import * as signalR from '@microsoft/signalr';

const HUB_URL = 'http://localhost:5164/hubs/project';

function buildHubConnection() {
  return new signalR.HubConnectionBuilder()
    .withUrl(HUB_URL, {
      accessTokenFactory: () => localStorage.getItem('token') || '',
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000])
    .build();
}

export const createUserNotificationHubConnection = (onNotification) => {
  const connection = buildHubConnection();
  if (onNotification) {
    connection.on('ReceiveUserNotification', onNotification);
  }
  connection.start().catch(() => {});

  return {
    connection,
    stop: async () => {
      if (onNotification) {
        connection.off('ReceiveUserNotification', onNotification);
      }
      try {
        await connection.stop();
      } catch {
        return;
      }
    },
  };
};

export const createProjectHubConnection = (projectId, handlers = {}) => {
  const connection = buildHubConnection();

  if (handlers.onProjectMessage) {
    connection.on('ReceiveProjectMessage', handlers.onProjectMessage);
  }

  if (handlers.onTaskUpdate) {
    connection.on('ReceiveTaskUpdate', handlers.onTaskUpdate);
  }

  if (handlers.onProjectDataChanged) {
    connection.on('ReceiveProjectDataChanged', handlers.onProjectDataChanged);
  }

  connection.onreconnecting(() => {
    if (handlers.onConnectionChange) handlers.onConnectionChange(false);
  });

  connection.onreconnected(async () => {
    try {
      await connection.invoke('JoinProject', String(projectId));
      if (handlers.onConnectionChange) handlers.onConnectionChange(true);
    } catch {
      if (handlers.onConnectionChange) handlers.onConnectionChange(false);
    }
  });

  connection.onclose(() => {
    if (handlers.onConnectionChange) handlers.onConnectionChange(false);
  });

  const start = async () => {
    try {
      await connection.start();
      await connection.invoke('JoinProject', String(projectId));
      if (handlers.onConnectionChange) {
        handlers.onConnectionChange(true);
      }
    } catch {
      if (handlers.onConnectionChange) {
        handlers.onConnectionChange(false);
      }
    }
  };

  start();

  return {
    connection,
    stop: async () => {
      try {
        if (connection.state === signalR.HubConnectionState.Connected) {
          await connection.invoke('LeaveProject', String(projectId));
        }
        await connection.stop();
        if (handlers.onConnectionChange) {
          handlers.onConnectionChange(false);
        }
      } catch {
      }
    },
  };
};
