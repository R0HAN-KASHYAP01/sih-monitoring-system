// FILE: apps/mobile/app/(main)/dashboard.jsx

import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { supabase } from '../../lib/supabaseClient';

export default function DashboardScreen() {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Assigned Inspections</Text>
      <Text style={styles.subtitle}>No assignments yet — built in Phase 8.2</Text>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 60, backgroundColor: '#f9fafb' },
  title: { fontSize: 20, fontWeight: '600', color: '#111827', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6b7280' },
  logoutButton: { marginTop: 32, alignSelf: 'flex-start' },
  logoutText: { color: '#dc2626', fontSize: 14, fontWeight: '500' },
});