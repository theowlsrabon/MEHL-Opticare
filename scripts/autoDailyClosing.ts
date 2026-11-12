import {
  dbGetDailyClosingData,
  dbInsertDrawerClosingIfAbsent,
  getDbPool,
} from '../serverDb';

const TIME_ZONE = 'Asia/Dhaka';

function getDhakaDate(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required for scheduled daily closing.');
  }

  try {
    const date = getDhakaDate(new Date());
    const dailyData = await dbGetDailyClosingData(date);

    if (dailyData.savedClosing) {
      console.log(`[DailyClosing] ${date} already saved; automatic closing skipped.`);
      return;
    }

    const openingCash = Number(dailyData.openingCash) || 0;
    const cashInflow = Number(dailyData.cashReceived) || 0;
    const cashOutflow = Number(dailyData.cashOutflow) || 0;
    const closingDrawerCash = openingCash + cashInflow - cashOutflow;
    const saved = await dbInsertDrawerClosingIfAbsent({
      id: `closing-${date}`,
      date,
      openingCash,
      cashInflow,
      cashOutflow,
      closingDrawerCash,
      actualCountedCash: closingDrawerCash,
      discrepancy: 0,
      closedBy: 'System (Auto)',
      notes: `Automatically closed at ${new Date().toLocaleString('en-US', { timeZone: TIME_ZONE })} (${TIME_ZONE}).`,
    });

    console.log(
      saved
        ? `[DailyClosing] ${date} automatically saved.`
        : `[DailyClosing] ${date} was already saved; automatic closing skipped.`
    );
  } finally {
    await getDbPool().end();
  }
}

main().catch((error: unknown) => {
  console.error('[DailyClosing] Automatic save failed:', error);
  process.exitCode = 1;
});
