import { SignedIn, SignedOut, useUser } from '@clerk/clerk-expo'
import { Link, useRouter } from 'expo-router'
import { Text, View, ScrollView, StyleSheet, Dimensions, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import SignOutButton from '@/app/components/SignOutButton'
import useStore from '../../store/useStore';
import { useEffect, useState } from 'react'
import { Employee } from '@/types'
import EmployeePinLogin from '@/components/EmployeePinLogin'
import { getEmployees } from '@/lib/api'

const { width } = Dimensions.get('window')

export default function DashboardScreen() {
  const router = useRouter()
  const { user } = useUser()
  const [showEmployeePinModal, setShowEmployeePinModal] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const {

    authenticatedEmployee,
    setAuthenticatedEmployee,
    clearEmployeeAuth
  } = useStore();

  useEffect(() => {
    console.log('Dashboard screen useEffect called');

    // Fetch customers and employees for selection
    (async () => {
      try {
        const [employeesData] = await Promise.all([
          getEmployees()
        ]);
        console.log('Fetched employees:', employeesData);
        setEmployees(employeesData);
      } catch (error) {
        console.error('Failed to fetch data', error);
      }
    })();
  }, []);

  const handleEmployeeSelected = (employee: Employee) => {
    console.log('Employee selected:', employee.name);
    setAuthenticatedEmployee(employee);
    console.log('Authenticated employee set in store:', employee.name);
    setShowEmployeePinModal(false);
    //router.replace('/(tabs)')
    router.replace('/(tabs)');
  };

  const handleSelectEmployee = () => {
    console.log('Employee selection triggered');
    // Sign out current employee before showing PIN login
    clearEmployeeAuth();
    setShowEmployeePinModal(true);
  };

  return (
    <View style={styles.container}>
      <EmployeePinLogin
        visible={showEmployeePinModal}
        employees={employees}
        onEmployeeSelected={handleEmployeeSelected}
        onClose={() => {
          console.log('Employee PIN modal closed');
          setShowEmployeePinModal(false);
        }}
      />
      <SignedIn>
        <View style={styles.signedInContainer}>
          <View style={styles.welcomeCard}>
            <Ionicons name="person-circle" size={48} color="#007AFF" />
            <Text style={styles.welcomeTitle}>Welcome back!</Text>
            <Text style={styles.welcomeSubtitle}>
              {user?.emailAddresses[0].emailAddress}
            </Text>
            <Text style={styles.welcomeMessage}>
              Ready to manage your business? Access your dashboard below.
            </Text>
          </View>

          <View style={styles.actionButtons}>
            {/*<Link href="/(tabs)" style={styles.primaryButton}>
              <Ionicons name="grid" size={20} color="white" />
              <Text style={styles.primaryButtonText}>Point of Sale</Text>
            </Link>*/}

              <Pressable
               style={styles.primaryButton}
                onPress={() => setShowEmployeePinModal(true)}
              >
                <Ionicons name="key" size={20} color="white" />
                <Text style={styles.primaryButtonText}>PIN Login</Text>
              </Pressable>
            <SignOutButton />
          </View>
        </View>
      </SignedIn>

      <SignedOut>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <View style={styles.heroContent}>
              <Ionicons name="storefront" size={64} color="#007AFF" />
              <Text style={styles.heroTitle}>BoltexPOS</Text>
              <Text style={styles.heroSubtitle}>
                Modern Point of Sale System for Your Business
              </Text>
              <Text style={styles.heroDescription}>
                Streamline your sales, manage inventory, and grow your business with our comprehensive POS solution.
              </Text>
            </View>
          </View>

          {/* Features Section */}
          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>Why Choose BoltexPOS?</Text>

            <View style={styles.featuresGrid}>
              <View style={styles.featureCard}>
                <Ionicons name="cart" size={32} color="#007AFF" />
                <Text style={styles.featureTitle}>Easy Sales</Text>
                <Text style={styles.featureDescription}>
                  Quick and intuitive checkout process for faster transactions
                </Text>
              </View>

              <View style={styles.featureCard}>
                <Ionicons name="analytics" size={32} color="#007AFF" />
                <Text style={styles.featureTitle}>Smart Analytics</Text>
                <Text style={styles.featureDescription}>
                  Track sales, inventory, and business performance in real-time
                </Text>
              </View>

              <View style={styles.featureCard}>
                <Ionicons name="cloud" size={32} color="#007AFF" />
                <Text style={styles.featureTitle}>Cloud Sync</Text>
                <Text style={styles.featureDescription}>
                  Access your data anywhere with secure cloud synchronization
                </Text>
              </View>

              <View style={styles.featureCard}>
                <Ionicons name="shield-checkmark" size={32} color="#007AFF" />
                <Text style={styles.featureTitle}>Secure & Reliable</Text>
                <Text style={styles.featureDescription}>
                  Enterprise-grade security to protect your business data
                </Text>
              </View>
            </View>
          </View>

          {/* CTA Section */}
          <View style={styles.ctaSection}>
            <Text style={styles.ctaTitle}>Ready to Get Started?</Text>
            <Text style={styles.ctaSubtitle}>
              Join thousands of businesses using BoltexPOS
            </Text>

            <View style={styles.authButtons}>
              <Link href="/(auth)/sign-up" style={styles.signUpButton}>
                <Ionicons name="person-add" size={20} color="white" />
                <Text style={styles.signUpButtonText}>Create Account</Text>
              </Link>

              <Link href="/(auth)/sign-in" style={styles.signInButton}>
                <Ionicons name="log-in" size={20} color="#007AFF" />
                <Text style={styles.signInButtonText}>Sign In</Text>
              </Link>
            </View>
          </View>
        </ScrollView>
      </SignedOut>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },

  // Signed In Styles
  signedInContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  welcomeCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 16,
  },
  welcomeMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  actionButtons: {
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },

  // Hero Section
  heroSection: {
    backgroundColor: 'white',
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  heroContent: {
    alignItems: 'center',
    maxWidth: 400,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  heroDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },

  // Features Section
  featuresSection: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 32,
  },
  featuresGrid: {
    gap: 16,
  },
  featureCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },

  // CTA Section
  ctaSection: {
    backgroundColor: 'white',
    padding: 32,
    alignItems: 'center',
    marginTop: 24,
  },
  ctaTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  ctaSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  authButtons: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  signUpButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  signUpButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  signInButton: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  signInButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
})