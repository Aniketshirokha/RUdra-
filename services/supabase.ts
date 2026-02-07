
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://anuwwbdigqwvvqgdflbu.supabase.co';
const supabaseAnonKey = 'sb_publishable_zCi5D_efl5ZVztIu4QpyOg_-2PvWPJ6';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const db = {
  async upsert(table: string, data: any) {
    const { error } = await supabase.from(table).upsert(data);
    if (error) {
        console.error(`Error upserting to ${table}:`, error.message);
        throw error;
    }
  },
  
  async delete(table: string, id: string) {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) {
        console.error(`Error deleting from ${table}:`, error.message);
        throw error;
    }
  },
  
  async insertBatch(table: string, items: any[]) {
    if (items.length === 0) return;
    const { error } = await supabase.from(table).upsert(items, { onConflict: 'id' });
    if (error) {
        console.error(`Error batch inserting to ${table}:`, error.message);
        throw error;
    }
  },
  
  async clear(table: string) {
    const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) {
        console.warn(`Error clearing table ${table}:`, error.message);
    }
  },

  async loadAll() {
    const tables = [
        'investors', 'trades', 'daily_allocations', 'daily_charges', 
        'weekly_profits', 'monthly_profits', 'owner_daily_pnls', 
        'owner_weekly_profits', 'fund_transactions', 'daily_totals', 'audit_logs'
    ];
    
    const results: any = {};
    const promises = tables.map(async (table) => {
        const { data, error } = await supabase.from(table).select('*');
        if (error) {
            console.warn(`Table ${table} selection failed:`, error.message);
            return { table, data: [] };
        }
        return { table, data };
    });

    const settled = await Promise.all(promises);
    settled.forEach(res => {
        results[res.table] = res.data;
    });
    return results;
  },

  subscribe(table: string, callback: (payload: any) => void) {
    return supabase
      .channel(`db-changes-${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
          console.log(`Realtime update for ${table}:`, payload.eventType);
          callback(payload);
      })
      .subscribe();
  }
};
