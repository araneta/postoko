import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  Modal,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProductCard from '../../components/ProductCard';
import BarcodeScanner from '../../components/BarcodeScanner';
import CategoryPicker from '../../components/CategoryPicker';
import SupplierPicker from '../../components/SupplierPicker';
import CategoryFilter from '../../components/CategoryFilter';
import CustomAlert from '../../components/CustomAlert';
import useStore from '../../store/useStore';
import { Product } from '../../types';
import { pickImage, takePhoto, uploadImageToImageKit, checkFileSize } from '../../lib/imageUpload';
import { Redirect } from 'expo-router';
import { filterProducts } from '../../utils/searchUtils';

const initialFormData = {
  name: '',
  price: '',
  cost: '',
  stock: '',
  category: '',
  categoryId: '',
  categoryName: '',
  supplier: '',
  supplierId: '',
  supplierName: '',
  description: '',
  image: '',
  barcode: '',
  minStock: '',
};

export default function ProductsScreen() {
  const { products, categories, addProduct, updateProduct, deleteProduct, authenticatedEmployee, suppliers } = useStore();
  console.log('ProductsScreen: suppliers from store:', suppliers?.length || 0, suppliers);
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [formData, setFormData] = useState(initialFormData);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [customAlert, setCustomAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

  // Redirect to dashboard if no employee is logged in
  if (!authenticatedEmployee) {
    console.log('No authenticated employee, redirecting to dashboard');
    return <Redirect href="/(tabs)/dashboard" />;
  }

  // Filter products based on selected category and search query
  //const filteredProducts = filterProducts(products, searchQuery, selectedCategoryId);
  const filteredProducts = React.useMemo(() => {
      return filterProducts(products, searchQuery, selectedCategoryId);
    }, [products, searchQuery, selectedCategoryId]);


  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setCustomAlert({
      visible: true,
      title,
      message,
      type,
    });
  };

  const hideAlert = () => {
    setCustomAlert({
      visible: false,
      title: '',
      message: '',
      type: 'info',
    });
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price || !formData.stock) {
      showAlert('Validation Error', 'Please fill all required fields.', 'warning');
      return;
    }

    const product: Product = {
      id: editingProduct?.id || Date.now().toString(),
      name: formData.name,
      price: parseFloat(formData.price),
      cost: parseFloat(formData.cost) || 0,
      stock: parseInt(formData.stock),
      category: formData.categoryName || formData.category, // Backward compatibility
      categoryId: formData.categoryId,
      categoryName: formData.categoryName,
      supplier: formData.supplierName || formData.supplier, // Backward compatibility
      supplierId: formData.supplierId,
      supplierName: formData.supplierName,
      description: formData.description,
      image: formData.image || undefined,
      barcode: formData.barcode || undefined,
      minStock: formData.minStock ? parseInt(formData.minStock) : undefined,
    };
    if (isNaN(product.price) || isNaN(product.stock)) {
      showAlert('Validation Error', 'Price and stock must be valid numbers.', 'warning');
      return;
    }

    try {
      if (editingProduct) {
        console.log('Updating product with category:', product.categoryId, product.categoryName);
        await updateProduct(product);
      } else {
        console.log('Adding product with category:', product.categoryId, product.categoryName);
        await addProduct(product);
      }

      setModalVisible(false);
      setEditingProduct(null);
      setFormData(initialFormData);
    } catch (error: any) {
      console.error('Failed to save product:', error);
      let errorMessage = 'Failed to save product. Please try again.';

      try {
        const parsed = JSON.parse(error?.message);
        errorMessage = parsed?.message || errorMessage;
      } catch {
        errorMessage = error?.message || errorMessage;
      }
      showAlert('Error', errorMessage, 'error');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      cost: product.cost.toString(),
      stock: product.stock.toString(),
      category: product.category,
      categoryId: product.categoryId || '',
      categoryName: product.categoryName || product.category,
      supplier: product.supplierName || '',
      supplierId: product.supplierId || '',
      supplierName: product.supplierName || '',
      description: product.description || '',
      image: product.image || '',
      barcode: product.barcode || '',
      minStock: product.minStock?.toString() || '',
    });
    setUploadError(null);
    setModalVisible(true);
    console.log('Editing product with category:', product.categoryId, product.categoryName);
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setFormData(initialFormData);
    setUploadError(null);
    setModalVisible(true);
  };

  const handleDeletePress = (product: Product) => {
    setProductToDelete(product);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = () => {
    if (productToDelete) {
      deleteProduct(productToDelete.id);
      setDeleteModalVisible(false);
      setProductToDelete(null);
    }
  };

  const handleImagePicker = async (useCamera: boolean = false) => {
    // Clear any previous errors
    setUploadError(null);
    try {
      const imageUri = useCamera ? await takePhoto() : await pickImage();

      if (imageUri) {
        // Check file size first
        const sizeError = await checkFileSize(imageUri);
        if (sizeError) {
          setUploadError(sizeError);
          return;
        }

        setIsUploading(true);

        // Generate a unique filename
        const fileName = `product_${Date.now()}.jpg`;

        // Upload to ImageKit
        const uploadResult = await uploadImageToImageKit(imageUri, fileName);

        // Update form data with the uploaded image URL if upload was successful
        setFormData(prev => ({ ...prev, image: uploadResult.url }));  
        
      }
    } catch (error: any) {
      showAlert('Error', error.message, 'error');
    } finally {
      setIsUploading(false);
    }


  };

  const removeImage = () => {
    
    setFormData(prev => ({ ...prev, image: '' }));  
    setUploadError(null);
  };

  const handleBarcodeScanned = (barcode: string) => {
    setFormData(prev => ({ ...prev, barcode }));

    setShowBarcodeScanner(false);
  };

  const handleCategoryChange = (categoryId: string, categoryName: string) => {
    console.log('Category changed:', { categoryId, categoryName });
    setFormData(prev => ({ ...prev, categoryId, categoryName, category: categoryName }));
    
  };

  const handleSupplierChange = (supplierId: string, supplierName: string) => {
    setFormData(prev => ({ ...prev, supplierId, supplierName }));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Products</Text>
        <Pressable
          style={styles.addButton}
          onPress={handleAddProduct}>
          <Ionicons name="add" size={24} color="white" />
          <Text style={styles.addButtonText}>Add Product</Text>
        </Pressable>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable
            style={styles.clearButton}
            onPress={() => setSearchQuery('')}
          >
            <Ionicons name="close-circle" size={20} color="#666" />
          </Pressable>
        )}
      </View>

      {/* Category Filter */}
      <CategoryFilter
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onCategorySelect={setSelectedCategoryId}
      />

      <FlatList
        data={filteredProducts}
        renderItem={({ item }) => (
          <View style={styles.productContainer}>
            <View style={styles.productCardWrapper}>
              <ProductCard
                product={item}
                onPress={() => handleEdit(item)}
                showAddToCart={false}
              />
            </View>
            <Pressable
              style={styles.deleteButton}
              onPress={() => handleDeletePress(item)}>
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            </Pressable>
          </View>
        )}
        keyExtractor={(item) => item.id}
      />

      {/* Edit/Add Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setFormData(initialFormData);
          setUploadError(null);
        }}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </Text>

            {/* Image Upload Section */}
            <View style={styles.imageSection}>
              <Text style={styles.sectionTitle}>Product Image</Text>

              {uploadError && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={20} color="#FF3B30" />
                  <Text style={styles.errorText}>{uploadError}</Text>
                </View>
              )}

              {formData.image ? (
                <View style={styles.imagePreviewContainer}>
                  <Image
                    source={{ uri: formData.image }}
                    style={styles.imagePreview}
                  />
                  <Pressable
                    style={styles.removeImageButton}
                    onPress={removeImage}>
                    <Ionicons name="close-circle" size={24} color="#FF3B30" />
                  </Pressable>
                </View>
              ) : (
                <View style={styles.imageUploadContainer}>
                  <Pressable
                    style={styles.imageUploadButton}
                    onPress={() => handleImagePicker(false)}
                    disabled={isUploading}>
                    <Ionicons name="image-outline" size={32} color="#007AFF" />
                    <Text style={styles.imageUploadText}>Choose from Gallery</Text>
                  </Pressable>

                  <Pressable
                    style={styles.imageUploadButton}
                    onPress={() => handleImagePicker(true)}
                    disabled={isUploading}>
                    <Ionicons name="camera-outline" size={32} color="#007AFF" />
                    <Text style={styles.imageUploadText}>Take Photo</Text>
                  </Pressable>
                </View>
              )}

              {isUploading && (
                <View style={styles.uploadingContainer}>
                  <ActivityIndicator size="small" color="#007AFF" />
                  <Text style={styles.uploadingText}>Uploading image...</Text>
                </View>
              )}
            </View>

            <TextInput
              style={styles.input}
              placeholder="Product Name"
              value={formData.name}
              onChangeText={(text) =>
                setFormData(prev => ({ ...prev, name: text }))
              }

            />

            <TextInput
              style={styles.input}
              placeholder="Price"
              value={formData.price}
              onChangeText={(text) =>
                setFormData(prev => ({ ...prev, price: text }))
              }
              keyboardType="decimal-pad"
            />

            <TextInput
              style={styles.input}
              placeholder="Cost"
              value={formData.cost}
              onChangeText={(text) =>
                setFormData(prev => ({ ...prev, cost: text }))
              }
              keyboardType="decimal-pad"
            />

            <TextInput
              style={styles.input}
              placeholder="Stock"
              value={formData.stock}
              onChangeText={(text) =>
                setFormData(prev => ({ ...prev, stock: text }))
              }
              keyboardType="number-pad"
            />

            <TextInput
              style={styles.input}
              placeholder="Low Stock Threshold (optional)"
              value={formData.minStock}
              onChangeText={(text) =>
              setFormData(prev => ({ ...prev, minStock: text }))
              }
              keyboardType="number-pad"
            />

            <CategoryPicker
              categories={categories}
              selectedCategoryId={formData.categoryId}
              onCategoryChange={handleCategoryChange}
              placeholder="Select a category"
            />

            <View style={styles.barcodeContainer}>
              <TextInput
                style={[styles.input, styles.barcodeInput]}
                placeholder="Barcode (optional)"
                value={formData.barcode}
                onChangeText={(text) =>
                  setFormData(prev => ({ ...prev, barcode: text }))
                }
              />
              <Pressable
                style={styles.scanBarcodeButton}
                onPress={() => setShowBarcodeScanner(true)}>
                <Ionicons name="scan-outline" size={20} color="white" />
              </Pressable>
            </View>
            <SupplierPicker
              suppliers={suppliers}
              selectedSupplierId={formData.supplierId}
              onSupplierChange={handleSupplierChange}
              placeholder="Select a supplier"
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description"
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              multiline
            />

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setFormData(initialFormData);
                  setUploadError(null);
                }}>
                <Text style={styles.buttonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.button, styles.saveButton, isUploading && { opacity: 0.6 }]}

                onPress={handleSave}>
                <Text style={[styles.buttonText, styles.saveButtonText]}>
                  {editingProduct ? 'Update' : 'Save'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, styles.deleteModalContent]}>
            <Text style={styles.deleteModalTitle}>Delete Product</Text>
            <Text style={styles.deleteModalText}>
              Are you sure you want to delete "{productToDelete?.name}"? This action cannot be undone.
            </Text>

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.button, styles.cancelButton]}
                onPress={() => setDeleteModalVisible(false)}>
                <Text style={styles.buttonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.button, styles.deleteConfirmButton]}
                onPress={handleConfirmDelete}>
                <Text style={[styles.buttonText, styles.deleteButtonText]}>
                  Delete
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Barcode Scanner Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showBarcodeScanner}
        onRequestClose={() => setShowBarcodeScanner(false)}>
        <BarcodeScanner
          onClose={() => setShowBarcodeScanner(false)}
          onProductScanned={() => { }} // Not used in raw mode
          rawBarcodeMode={true}
          onBarcodeScanned={handleBarcodeScanned}
        />
      </Modal>

      {/* Custom Alert */}
      <CustomAlert
        visible={customAlert.visible}
        title={customAlert.title}
        message={customAlert.message}
        type={customAlert.type}
        onClose={hideAlert}
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
  productContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productCardWrapper: {
    flex: 1,
  },
  deleteButton: {
    padding: 8,
    marginRight: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 500,
  },
  deleteModalContent: {
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    color: '#FF3B30',
  },
  deleteModalText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    lineHeight: 22,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    marginLeft: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  deleteConfirmButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: 'white',
  },
  deleteButtonText: {
    color: 'white',
  },
  imageSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 8,
  },
  removeImageButton: {
    padding: 8,
  },
  imageUploadContainer: {
    flexDirection: 'column',
    gap: 8,
    marginBottom: 12,
  },
  imageUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  imageUploadText: {
    marginLeft: 8,
    fontSize: 16,
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  uploadingText: {
    marginLeft: 8,
    fontSize: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  errorText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#FF3B30',
    flex: 1,
  },
  barcodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  barcodeInput: {
    flex: 1,
  },
  scanBarcodeButton: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    backgroundColor: '#007AFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
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
});