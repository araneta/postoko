import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Redirect } from 'expo-router';
import CategoryCard from '../../components/CategoryCard';
import CategoryForm from '../../components/CategoryForm';
import useStore from '../../store/useStore';
import { Category } from '../../types';
import { filterCategories } from '../../utils/searchUtils';

export default function CategoriesScreen() {
  const { 
    categories, 
    addCategory, 
    updateCategory, 
    deleteCategory, 
    authenticatedEmployee,
    initializeStore
  } = useStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Redirect to dashboard if no employee is logged in
  if (!authenticatedEmployee) {
    console.log('No authenticated employee, redirecting to dashboard');
    return <Redirect href="/(tabs)/dashboard" />;
  }

  // Filter categories based on search query
  const filteredCategories = filterCategories(categories, searchQuery);

  const handleAddCategory = () => {
    setEditingCategory(null);
    setShowForm(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleDeleteCategory = (category: Category) => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCategory(category.id.toString());
            } catch (error) {
              Alert.alert('Error', 'Failed to delete category. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleSaveCategory = async (category: Category) => {
    try {
      if (editingCategory) {
        await updateCategory(category);
      } else {
        await addCategory(category);
      }
      setShowForm(false);
      setEditingCategory(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to save category. Please try again.');
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingCategory(null);
  };

  const renderCategoryCard = ({ item }: { item: Category }) => (
    <CategoryCard
      category={item}
      onEdit={() => handleEditCategory(item)}
      onDelete={() => handleDeleteCategory(item)}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="folder-outline" size={64} color="#ccc" />
      <Text style={styles.emptyStateTitle}>No Categories Found</Text>
      <Text style={styles.emptyStateText}>
        {searchQuery 
          ? 'No categories match your search criteria.'
          : 'Get started by adding your first category.'
        }
      </Text>
      {!searchQuery && (
        <Pressable style={styles.emptyStateButton} onPress={handleAddCategory}>
          <Text style={styles.emptyStateButtonText}>Add Category</Text>
        </Pressable>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Categories</Text>
        <View style={styles.headerButtons}>
          <Pressable 
            style={[styles.addButton, { marginRight: 8, backgroundColor: '#34C759' }]} 
            onPress={() => initializeStore()}
          ><Ionicons name="refresh" size={20} color="white" /></Pressable>
          <Pressable style={styles.addButton} onPress={handleAddCategory}><Ionicons name="add" size={24} color="white" /><Text style={styles.addButtonText}>Add Category</Text></Pressable>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search categories..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable
            style={styles.clearButton}
            onPress={() => setSearchQuery('')}
          ><Ionicons name="close-circle" size={20} color="#666" /></Pressable>
        )}
      </View>

      {/* Categories List */}
      <FlatList
        data={filteredCategories}
        renderItem={renderCategoryCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {/* Category Form Modal */}
      <CategoryForm
        visible={showForm}
        category={editingCategory}
        onSave={handleSaveCategory}
        onCancel={handleCancelForm}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    marginLeft: 4,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
  },
  listContainer: {
    paddingBottom: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 100,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});