import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Button, Modal, TextInput, Alert, Pressable, ScrollView } from 'react-native';
import { getEmployees, addEmployee, updateEmployee, deleteEmployee, getRoles } from '../../lib/api';
import { Employee, Role } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { v4 as uuidv4 } from 'uuid';
import useStore from '../../store/useStore';

const initialFormData = {
  id: '',
  name: '',
  email: '',
  password: '',
  pin: '',
  roleId: 0,
  storeInfoId: 0,
};

const EmployeesScreen = () => {
  const { settings } = useStore();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [formError, setFormError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchEmployees();
    fetchRoles();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const data = await getEmployees();
      setEmployees(data);
    } catch (error) {
      console.error('Failed to fetch employees', error);
    }
    setLoading(false);
  };

  const fetchRoles = async () => {
    try {
      const data = await getRoles();
      setRoles(data);
    } catch (error) {
      setRoles([]);
    }
  };

  const handleAddEmployee = () => {
    setEditingEmployee(null);
    setFormData({ ...initialFormData, id: uuidv4(), storeInfoId: settings?.storeInfo?.id || 0 });
    setFormError('');
    setShowFormModal(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      id: employee.id,
      name: employee.name,
      email: employee.email,
      password: '',
      pin: employee.pin || '',
      roleId: employee.roleId,
      storeInfoId: employee.storeInfoId,
    });
    setFormError('');
    setShowFormModal(true);
  };

  const handleDeletePress = (employee: Employee) => {
    setEmployeeToDelete(employee);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!employeeToDelete) return;
    try {
      await deleteEmployee(employeeToDelete.id);
      setShowDeleteModal(false);
      setEmployeeToDelete(null);
      fetchEmployees();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete employee');
    }
  };

  const handleFormSubmit = async () => {
    if (!formData.name || !formData.email || !formData.roleId) {
      setFormError('Name, email, and role are required');
      return;
    }
    try {
      if (editingEmployee) {
        await updateEmployee({ ...formData, id: editingEmployee.id, pin: formData.pin || undefined });
      } else {
        if (!formData.password) {
          setFormError('Password is required for new employees');
          return;
        }
        if (!formData.pin) {
          setFormError('PIN is required for employees');
          return;
        }
        await addEmployee({ ...formData, pin: formData.pin || undefined });
      }
      setShowFormModal(false);
      fetchEmployees();
    } catch (error) {
      setFormError('Failed to save employee');
    }
  };

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(search.toLowerCase()) ||
    emp.email.toLowerCase().includes(search.toLowerCase())
  );

  const renderEmployee = ({ item }: { item: Employee }) => (
    <TouchableOpacity style={styles.item} onPress={() => handleEditEmployee(item)}>
      <Ionicons name="person" size={24} color="#007AFF" style={{ marginRight: 12 }} />
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.email}>{item.email}</Text>
        <Text style={styles.role}>{roles.find(r => r.id === item.roleId)?.name || 'Unknown'}</Text>
      </View>
      <TouchableOpacity onPress={() => handleDeletePress(item)}>
        <Ionicons name="trash" size={20} color="#FF3B30" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Employees</Text>
        <Button title="Add" onPress={handleAddEmployee} />
      </View>
      <TextInput
        style={styles.search}
        placeholder="Search employees..."
        value={search}
        onChangeText={setSearch}
      />
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredEmployees}
          keyExtractor={item => item.id}
          renderItem={renderEmployee}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}
      <Modal visible={showFormModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>{editingEmployee ? 'Edit Employee' : 'Add Employee'}</Text>
              <TextInput
                style={styles.input}
                placeholder="Name"
                value={formData.name}
                onChangeText={text => setFormData({ ...formData, name: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={formData.email}
                onChangeText={text => setFormData({ ...formData, email: text })}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              {!editingEmployee && (
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  value={formData.password}
                  onChangeText={text => setFormData({ ...formData, password: text })}
                  secureTextEntry
                />
              )}
              <TextInput
                style={styles.input}
                placeholder="PIN (4-6 digits)"
                value={formData.pin}
                onChangeText={text => setFormData({ ...formData, pin: text })}
                keyboardType="numeric"
                secureTextEntry
              />
              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Role:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {roles.map(role => (
                    <TouchableOpacity
                      key={role.id}
                      style={[
                        styles.roleOption,
                        formData.roleId === role.id && styles.roleOptionSelected,
                      ]}
                      onPress={() => setFormData({ ...formData, roleId: role.id })}
                    >
                      <Text style={styles.roleOptionText}>{role.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              {formError ? <Text style={styles.error}>{formError}</Text> : null}
              <View style={styles.modalButtons}>
                <Pressable
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => setShowFormModal(false)}>
                  <Text style={styles.buttonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.button, styles.saveButton]}
                  onPress={handleFormSubmit}>
                  <Text style={[styles.buttonText, styles.saveButtonText]}>{editingEmployee ? 'Save' : 'Add Employee'}</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
      <Modal visible={showDeleteModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalContent}>
            <Text style={styles.modalTitle}>Delete Employee?</Text>
            <Text>Are you sure you want to delete this employee?</Text>
            <View style={styles.modalButtons}>
              <Button title="Cancel" onPress={() => setShowDeleteModal(false)} />&nbsp;
              <Button title="Delete" color="#FF3B30" onPress={handleConfirmDelete} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold' },
  search: { backgroundColor: '#f2f2f2', marginHorizontal: 16, borderRadius: 8, padding: 10, marginBottom: 8 },
  item: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#eee' },
  name: { fontSize: 16, fontWeight: 'bold' },
  email: { fontSize: 14, color: '#888' },
  role: { fontSize: 13, color: '#007AFF', marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 20, width: '90%', maxHeight: '90%' },
  deleteModalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 20, width: 300, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  input: { backgroundColor: '#f2f2f2', borderRadius: 8, padding: 10, marginBottom: 12 },
  pickerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  pickerLabel: { fontWeight: 'bold', marginRight: 8 },
  roleOption: { backgroundColor: '#eee', borderRadius: 16, paddingVertical: 6, paddingHorizontal: 14, marginRight: 8 },
  roleOptionSelected: { backgroundColor: '#007AFF' },
  roleOptionText: { color: '#333' },
  error: { color: '#FF3B30', marginBottom: 8 },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  button: {
    padding: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
    marginLeft: 12,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: 'white',
  },
});

export default EmployeesScreen; 