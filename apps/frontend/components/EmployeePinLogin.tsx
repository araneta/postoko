import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { validateEmployeePin } from '../lib/api';
import { Employee } from '../types';

interface EmployeePinLoginProps {
  visible: boolean;
  employees: Employee[];
  onEmployeeSelected: (employee: Employee) => void;
  onClose: () => void;
}

const EmployeePinLogin: React.FC<EmployeePinLoginProps> = ({
  visible,
  employees,
  onEmployeeSelected,
  onClose
}) => {
  console.log('EmployeePinLogin component initialized with visible:', visible);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmployeeSelect = (employee: Employee) => {
    console.log('Employee selected in PIN login:', employee.name);
    setSelectedEmployee(employee);
    setPin('');
    setError('');
  };

  const handlePinSubmit = async () => {
    if (!selectedEmployee) {
      setError('Please select an employee first');
      return;
    }
    
    if (!pin) {
      setError('Please enter your PIN');
      return;
    }
    
    console.log('Validating PIN for employee:', selectedEmployee.id);
    setLoading(true);
    setError('');
    
    try {
      const isValid = await validateEmployeePin(selectedEmployee.id, pin);
      console.log('PIN validation result:', isValid);
      if (isValid) {
        console.log('Employee authenticated:', selectedEmployee.name);
        onEmployeeSelected(selectedEmployee);
        // Reset form
        setSelectedEmployee(null);
        setPin('');
      } else {
        setError('Invalid PIN. Please try again.');
      }
    } catch (err) {
      setError('Failed to validate PIN. Please try again.');
      console.error('PIN validation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    console.log('Employee PIN login closed');
    // Reset form
    setSelectedEmployee(null);
    setPin('');
    setError('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => {
        console.log('Employee PIN modal close requested');
        handleClose();
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {!selectedEmployee ? (
            // Employee selection view
            <View>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Employee</Text>
                <TouchableOpacity onPress={handleClose}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.modalSubtitle}>
                Please select an employee to continue
              </Text>
              
              <View style={styles.employeeList}>
                {employees.map((employee) => (
                  <TouchableOpacity
                    key={employee.id}
                    style={styles.employeeItem}
                    onPress={() => handleEmployeeSelect(employee)}
                  >
                    <Ionicons name="person" size={24} color="#007AFF" style={styles.employeeIcon} />
                    <View style={styles.employeeInfo}>
                      <Text style={styles.employeeName}>{employee.name}</Text>
                      <Text style={styles.employeeEmail}>{employee.email}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#ccc" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            // PIN entry view
            <View>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setSelectedEmployee(null)}>
                  <Ionicons name="arrow-back" size={24} color="#007AFF" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Enter PIN</Text>
                <TouchableOpacity onPress={handleClose}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.pinSection}>
                <Ionicons name="person-circle" size={64} color="#007AFF" style={styles.employeeAvatar} />
                <Text style={styles.employeeNameLarge}>{selectedEmployee.name}</Text>
                <Text style={styles.pinInstruction}>
                  Enter your 4-6 digit PIN to continue
                </Text>
                
                <TextInput
                  style={styles.pinInput}
                  placeholder="Enter PIN"
                  value={pin}
                  onChangeText={setPin}
                  keyboardType="numeric"
                  secureTextEntry
                  autoFocus
                  onSubmitEditing={handlePinSubmit}
                />
                
                {error ? <Text style={styles.errorText}>{error}</Text> : null}
                
                <TouchableOpacity
                  style={[styles.submitButton, loading && styles.disabledButton]}
                  onPress={handlePinSubmit}
                  disabled={loading}
                >
                  <Text style={styles.submitButtonText}>
                    {loading ? 'Validating...' : 'Continue'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  employeeList: {
    maxHeight: 300,
  },
  employeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  employeeIcon: {
    marginRight: 12,
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  employeeEmail: {
    fontSize: 14,
    color: '#666',
  },
  pinSection: {
    alignItems: 'center',
  },
  employeeAvatar: {
    marginBottom: 16,
  },
  employeeNameLarge: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  pinInstruction: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  pinInput: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    width: '100%',
    textAlign: 'center',
    marginBottom: 16,
  },
  errorText: {
    color: '#FF3B30',
    marginBottom: 16,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    width: '100%',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default EmployeePinLogin;