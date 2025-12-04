import { config } from 'dotenv';
import { createTestSupabaseClient, getTestUserId } from '../helpers/supabase';

// Załaduj zmienne środowiskowe z pliku .env
config();

/**
 * Global Teardown - czyszczenie bazy danych Supabase po wszystkich testach E2E
 * 
 * Ten skrypt wykonuje się automatycznie po zakończeniu wszystkich testów i czyści dane testowe z bazy:
 * - Usuwa posiłki (meals) użytkownika testowego
 * - Usuwa tygodnie (weeks) użytkownika testowego
 * - Usuwa cele (user_goals) użytkownika testowego
 * 
 * UWAGA: Nie usuwa użytkownika testowego z auth.users, aby mógł być użyty ponownie
 */
async function globalTeardown() {
  console.log('\n🧹 Starting database cleanup...');

  try {
    const supabase = createTestSupabaseClient();

    // Pobierz ID użytkownika testowego
    const testEmail = process.env.TEST_EMAIL || 'lekki@gmail.com';
    const userId = await getTestUserId(testEmail);

    if (!userId) {
      console.warn('⚠️  Could not find test user. Skipping cleanup.');
      return;
    }

    console.log(`🔍 Found test user: ${testEmail} (ID: ${userId})`);

    // 1. Usuń posiłki użytkownika testowego
    const { error: mealsError, count: mealsCount } = await supabase
      .from('meals')
      .delete({ count: 'exact' })
      .eq('user_id', userId);

    if (mealsError) {
      console.error('❌ Error deleting meals:', mealsError);
      throw mealsError;
    }
    console.log(`✅ Deleted ${mealsCount ?? 0} meals`);

    // 2. Usuń tygodnie użytkownika testowego
    const { error: weeksError, count: weeksCount } = await supabase
      .from('weeks')
      .delete({ count: 'exact' })
      .eq('user_id', userId);

    if (weeksError) {
      console.error('❌ Error deleting weeks:', weeksError);
      throw weeksError;
    }
    console.log(`✅ Deleted ${weeksCount ?? 0} weeks`);

    // 3. Usuń cele użytkownika testowego
    const { error: goalsError, count: goalsCount } = await supabase
      .from('user_goals')
      .delete({ count: 'exact' })
      .eq('user_id', userId);

    if (goalsError) {
      console.error('❌ Error deleting user goals:', goalsError);
      throw goalsError;
    }
    console.log(`✅ Deleted ${goalsCount ?? 0} user goals`);

    console.log('✨ Database cleanup completed successfully!\n');
  } catch (error) {
    console.error('❌ Database cleanup failed:', error);
    throw error;
  }
}

export default globalTeardown;

