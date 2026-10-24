type Closer = {
  name: string;
  close: () => Promise<unknown>;
};

const closers: Closer[] = [];

export const registerCloser = (name: string, close: () => Promise<unknown>) => {
  closers.push({ name, close });
};

export const closeAll = async () => {
  const failures: unknown[] = [];
  for (const { name, close } of closers.reverse()) {
    try {
      await close();
    } catch (error) {
      console.error(`[worker] failed to close ${name}`, error);
      failures.push(error);
    }
  }
  if (failures.length > 0) {
    throw new AggregateError(failures, "worker shutdown failed");
  }
};
