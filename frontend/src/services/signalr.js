import * as signalR from '@microsoft/signalr';

export const createProjectHubConnection = (projectId, handlers = {}) => {
  const connection = new signalR.HubConnectionBuilder()
    .withUrl('http://localhost:5164/hubs/project', {
      accessTokenFactory: () => localStorage.getItem('token') || '',
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000])
    .build();

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
