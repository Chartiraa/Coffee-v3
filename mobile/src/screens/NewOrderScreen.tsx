import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product, Category, Table, Order, OrderItem, OrderItemOption } from '../types/order';
import { menuService, tableService, orderService } from '../services/api';
import { Text as PaperText } from 'react-native-paper';

export const NewOrderScreen = () => {
  // State tanımlamaları
  const [loading, setLoading] = useState(false);
  const [tables, setTables] = useState<Table[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<OrderItemOption[]>([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [showOrdersModal, setShowOrdersModal] = useState(false);

  // Veri yükleme
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Masaları yükle
      const tablesResponse = await tableService.getTables(true);
      setTables(tablesResponse.data);
    } catch (error) {
      Alert.alert('Hata', 'Masalar yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const loadMenuData = async () => {
    setLoading(true);
    try {
      // Kategorileri yükle
      const categoriesResponse = await menuService.getActiveCategories();
      setCategories(categoriesResponse.data);

      // Ürünleri yükle
      const productsResponse = await menuService.getActiveProducts();
      setProducts(productsResponse.data);
      setFilteredProducts(productsResponse.data);
    } catch (error) {
      Alert.alert('Hata', 'Menü yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const loadActiveOrders = async (tableId: number) => {
    try {
      const response = await orderService.getTableOrders(tableId, 'active');
      // Sadece aktif durumda olan siparişleri filtrele
      const activeOrders = response.data.filter((order: Order) => 
        ['created', 'in_progress', 'ready', 'delivered'].includes(order.status)
      );
      setActiveOrders(activeOrders);
      
      // Eğer aktif sipariş varsa ve ilk kez yükleniyorsa modalı göster
      if (activeOrders.length > 0 && !showOrdersModal) {
        setShowOrdersModal(true);
      }
    } catch (error: any) {
      console.error('Sipariş yükleme hatası:', error);
      Alert.alert(
        'Hata',
        error.response?.data?.error || 'Siparişler yüklenirken bir hata oluştu. Lütfen tekrar deneyin.'
      );
    }
  };

  // Masa seçildiğinde menü verilerini ve aktif siparişleri yükle
  useEffect(() => {
    if (selectedTable) {
      loadMenuData();
      loadActiveOrders(selectedTable.id);
    }
  }, [selectedTable]);

  // Ürün filtreleme
  useEffect(() => {
    let filtered = products;
    
    if (selectedCategory) {
      filtered = filtered.filter(p => p.category_id === selectedCategory.id);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.description.toLowerCase().includes(query)
      );
    }
    
    setFilteredProducts(filtered);
  }, [selectedCategory, searchQuery, products]);

  // Ürün seçme
  const handleProductSelect = async (product: Product) => {
    try {
      const response = await menuService.getProductById(product.id);
      setSelectedProduct(response.data);
      setQuantity(1);
      setNotes('');
      setSelectedOptions([]);
      setShowProductModal(true);
    } catch (error) {
      Alert.alert('Hata', 'Ürün detayları alınamadı.');
    }
  };

  // Sipariş oluşturma
  const handleCreateOrder = async () => {
    if (!selectedProduct || !selectedTable) return;

    try {
      const orderData = {
        table_id: selectedTable.id,
        items: [{
          product_id: selectedProduct.id,
          quantity: quantity,
          notes: notes || undefined,
          options: selectedOptions.length > 0 ? selectedOptions : undefined
        }]
      };

      await orderService.createOrder(orderData);
      Alert.alert('Başarılı', 'Sipariş başarıyla oluşturuldu.');
      setShowProductModal(false);
      resetForm();
    } catch (error) {
      Alert.alert('Hata', 'Sipariş oluşturulurken bir hata oluştu.');
    }
  };

  const resetForm = () => {
    setSelectedProduct(null);
    setQuantity(1);
    setNotes('');
    setSelectedOptions([]);
  };

  const handleTableSelect = (table: Table) => {
    setSelectedTable(table);
  };

  const handleBackToTables = () => {
    setSelectedTable(null);
    setSelectedCategory(null);
    setSearchQuery('');
    setProducts([]);
    setFilteredProducts([]);
    setActiveOrders([]);
  };

  // Render fonksiyonları
  const renderTableItem = ({ item }: { item: Table }) => (
    <TouchableOpacity
      style={[
        styles.tableCard,
        selectedTable?.id === item.id && styles.selectedTableCard
      ]}
      onPress={() => handleTableSelect(item)}
    >
      <Ionicons name="restaurant" size={24} color="#007AFF" />
      <Text style={styles.tableNumber}>{item.name}</Text>
      <Text style={styles.tableCapacity}>{item.capacity} Kişilik</Text>
      <View style={[
        styles.statusBadge,
        { backgroundColor: item.status === 'available' ? '#4CAF50' : '#f44336' }
      ]}>
        <Text style={styles.statusText}>
          {item.status === 'available' ? 'Müsait' : 'Dolu'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderCategoryItem = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={[
        styles.categoryButton,
        selectedCategory?.id === item.id && styles.selectedCategoryButton
      ]}
      onPress={() => setSelectedCategory(item)}
    >
      <Text style={[
        styles.categoryText,
        selectedCategory?.id === item.id && styles.selectedCategoryText
      ]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => handleProductSelect(item)}
    >
      <Text style={styles.productName}>{item.name}</Text>
      <Text style={styles.productDescription} numberOfLines={2}>
        {item.description}
      </Text>
      <Text style={styles.productPrice}>
        {item.price.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
      </Text>
    </TouchableOpacity>
  );

  const renderOrderItem = ({ item }: { item: OrderItem }) => (
    <View style={styles.orderItemCard}>
      <View style={styles.orderItemHeader}>
        <Text style={styles.orderItemName}>{item.product_name}</Text>
        <Text style={styles.orderItemQuantity}>x{item.quantity}</Text>
      </View>
      {item.notes && (
        <Text style={styles.orderItemNotes}>{item.notes}</Text>
      )}
      <Text style={styles.orderItemPrice}>
        {item.total_price.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Masa seçilmemişse masaları listele
  if (!selectedTable) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Masalar</Text>
        </View>
        <FlatList
          data={tables}
          renderItem={renderTableItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.tablesList}
        />
      </View>
    );
  }

  // Masa seçilmişse ürünleri göster
  return (
    <View style={styles.container}>
      <PaperText variant="headlineMedium">Yeni Sipariş</PaperText>
      {/* Üst Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackToTables}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>{selectedTable.name}</Text>

        <TouchableOpacity
          style={styles.ordersButton}
          onPress={() => setShowOrdersModal(true)}
        >
          <Ionicons name="receipt-outline" size={24} color="#007AFF" />
          {activeOrders.length > 0 && (
            <View style={styles.ordersBadge}>
              <Text style={styles.ordersBadgeText}>{activeOrders.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Ürün ara..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Kategoriler */}
      <View style={styles.categoriesContainer}>
        <FlatList
          horizontal
          data={[{ id: 0, name: 'Tümü' } as Category, ...categories]}
          renderItem={renderCategoryItem}
          keyExtractor={item => item.id.toString()}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {/* Ürünler */}
      <FlatList
        data={filteredProducts}
        renderItem={renderProductItem}
        keyExtractor={item => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.productsList}
      />

      {/* Ürün Detay Modalı */}
      <Modal
        visible={showProductModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedProduct?.name}
              </Text>
              <TouchableOpacity onPress={() => setShowProductModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.productDetails}>
              <Text style={styles.productDetailDescription}>
                {selectedProduct?.description}
              </Text>
              
              <View style={styles.quantityContainer}>
                <Text style={styles.quantityLabel}>Adet:</Text>
                <TouchableOpacity
                  onPress={() => setQuantity(Math.max(1, quantity - 1))}
                  style={styles.quantityButton}
                >
                  <Ionicons name="remove" size={24} color="#007AFF" />
                </TouchableOpacity>
                <Text style={styles.quantityText}>{quantity}</Text>
                <TouchableOpacity
                  onPress={() => setQuantity(quantity + 1)}
                  style={styles.quantityButton}
                >
                  <Ionicons name="add" size={24} color="#007AFF" />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.notesInput}
                placeholder="Sipariş notu ekleyin..."
                value={notes}
                onChangeText={setNotes}
                multiline
              />

              <Text style={styles.totalPrice}>
                Toplam: {((selectedProduct?.price || 0) * quantity).toLocaleString('tr-TR', {
                  style: 'currency',
                  currency: 'TRY'
                })}
              </Text>

              <TouchableOpacity
                style={styles.orderButton}
                onPress={handleCreateOrder}
              >
                <Text style={styles.orderButtonText}>Sipariş Oluştur</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Aktif Siparişler Modalı */}
      <Modal
        visible={showOrdersModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Aktif Siparişler</Text>
              <TouchableOpacity onPress={() => setShowOrdersModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={activeOrders.flatMap(order => order.items)}
              renderItem={renderOrderItem}
              keyExtractor={(item, index) => `${item.id}-${index}`}
              contentContainerStyle={styles.ordersList}
              ListEmptyComponent={
                <Text style={styles.emptyText}>Aktif sipariş bulunmuyor</Text>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  backButton: {
    padding: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 8,
    marginLeft: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  categoriesContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
  },
  categoriesList: {
    paddingHorizontal: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  selectedCategoryButton: {
    backgroundColor: '#007AFF',
  },
  categoryText: {
    fontSize: 16,
    color: '#333',
  },
  selectedCategoryText: {
    color: '#fff',
  },
  productsList: {
    padding: 8,
  },
  productCard: {
    flex: 1,
    margin: 8,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  productDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  tablesList: {
    padding: 16,
  },
  tableCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedTableCard: {
    backgroundColor: '#e3f2fd',
  },
  tableNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  tableCapacity: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  statusBadge: {
    marginLeft: 'auto',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  productDetails: {
    padding: 16,
  },
  productDetailDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  quantityLabel: {
    fontSize: 16,
    marginRight: 16,
  },
  quantityButton: {
    padding: 8,
  },
  quantityText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 16,
  },
  notesInput: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    minHeight: 80,
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    textAlign: 'right',
    marginBottom: 16,
  },
  orderButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  orderButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  ordersButton: {
    padding: 8,
    marginLeft: 8,
    position: 'relative',
  },
  ordersBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#f44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ordersBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  ordersList: {
    padding: 16,
  },
  orderItemCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  orderItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderItemName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  orderItemQuantity: {
    fontSize: 16,
    color: '#666',
  },
  orderItemNotes: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  orderItemPrice: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
    textAlign: 'right',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 24,
  },
}); 