export function tcxResponse(action: string, details?: Record<string, unknown>) {
  return {
    env: process.env.APP_ENV ?? 'dev',
    status: 200,
    data: {
      action,
      ...details,
    },
  };
}
