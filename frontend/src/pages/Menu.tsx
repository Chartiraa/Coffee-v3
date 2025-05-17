import React, { useState, useEffect, FormEvent } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  InputAdornment,
  FormControlLabel,
  Switch,
  CircularProgress,
  Alert,
  Snackbar,
  Badge,
  ListItemIcon,
  Tooltip,
  FormHelperText
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { menuService } from '../services/api';

// Örnek veri
interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category_id: number;
  image_url: string;
  active: boolean;
  is_active: boolean;
  preparation_time: number;
  is_available: boolean;
  sort_order: number;
  options?: ProductOption[];
}

interface Category {
  id: number;
  name: string;
  description: string;
  image_url: string;
  is_active: boolean;
  sort_order: number;
}

// Ürün seçenekleri için yeni arayüzler
interface ProductOption {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  is_required?: boolean;
  values: OptionValue[];
}

interface OptionValue {
  id: number;
  option_id: number;
  value: string;
  price_modifier: number;
  is_default: boolean;
  sort_order: number;
}

const Menu: React.FC = () => {
  const [tabValue, setTabValue] = useState<number>(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [openProductDialog, setOpenProductDialog] = useState<boolean>(false);
  const [openCategoryDialog, setOpenCategoryDialog] = useState<boolean>(false);
  const [openOptionDialog, setOpenOptionDialog] = useState<boolean>(false);
  const [openOptionValueDialog, setOpenOptionValueDialog] = useState<boolean>(false);
  const [openProductOptionDialog, setOpenProductOptionDialog] = useState<boolean>(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [currentOption, setCurrentOption] = useState<ProductOption | null>(null);
  const [currentOptionValue, setCurrentOptionValue] = useState<OptionValue | null>(null);
  const [selectedOption, setSelectedOption] = useState<ProductOption | null>(null);
  const [selectedProductOptionId, setSelectedProductOptionId] = useState<string>('');
  const [isRequiredOption, setIsRequiredOption] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success' | 'error'}>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Form state'leri
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: 0,
    category_id: '',
    image_url: '',
    is_active: true,
    preparation_time: 5,
    is_available: true,
    sort_order: 0
  });
  
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    image_url: '',
    is_active: true,
    sort_order: 0
  });

  // Seçenek formu
  const [optionForm, setOptionForm] = useState({
    name: '',
    description: '',
    is_active: true
  });

  // Seçenek değeri formu
  const [optionValueForm, setOptionValueForm] = useState({
    value: '',
    price_modifier: 0,
    is_default: false,
    sort_order: 0
  });

  // API'den veri çekiyoruz
  useEffect(() => {
    // Kategori ve ürün verilerini API'den çekme işlemi
    const fetchData = async () => {
      try {
        const categoryResponse = await menuService.getCategories();
        setCategories(categoryResponse.data);
        
        if (selectedCategory) {
          const productResponse = await menuService.getProducts(selectedCategory);
          setProducts(productResponse.data);
        } else {
          const productResponse = await menuService.getProducts();
          setProducts(productResponse.data);
        }
      } catch (error) {
        console.error('Menü verileri çekilirken hata oluştu:', error);
      }
    };
    
    fetchData();
  }, [selectedCategory]);

  // Seçenekleri getir
  useEffect(() => {
    const fetchOptions = async () => {
      if (tabValue === 2) { // Seçenekler sekmesi aktifse
        try {
          setLoading(true);
          const response: {data: ProductOption[]} = await menuService.getOptions();
          // Response kontrolü
          const optionsData = response.data || [];
          
          // Her seçenek için values alanını kontrol et ve gerekirse boş dizi ata
          const validatedOptions = optionsData.map(option => ({
            ...option,
            values: option.values || [] 
          }));
          
          setOptions(validatedOptions);
        } catch (error) {
          console.error('Seçenekler getirilirken hata oluştu:', error);
          setSnackbar({
            open: true,
            message: 'Seçenekler yüklenirken bir hata oluştu',
            severity: 'error'
          });
        } finally {
          setLoading(false);
        }
      }
    };

    fetchOptions();
  }, [tabValue]);

  // Seçeneğe ait değerleri getir
  useEffect(() => {
    const fetchOptionValues = async () => {
      if (selectedOption && selectedOption.id) {
        try {
          setLoading(true);
          const response: {data: OptionValue[]} = await menuService.getOptionValues(selectedOption.id);
          
          // Mevcut seçeneği güncelle
          const updatedOption = {
            ...selectedOption,
            values: response.data || []
          };
          
          // Options dizisini güncelle
          setOptions(options.map(opt => 
            opt.id === selectedOption.id ? updatedOption : opt
          ));
          
          setSelectedOption(updatedOption);
        } catch (error) {
          console.error('Seçenek değerleri getirilirken hata oluştu:', error);
          setSnackbar({
            open: true,
            message: 'Seçenek değerleri yüklenirken bir hata oluştu',
            severity: 'error'
          });
          
          // Hata durumunda da seçeneği boş değerlerle güncelle
          const updatedOption = {
            ...selectedOption,
            values: []
          };
          setSelectedOption(updatedOption);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchOptionValues();
  }, [selectedOption?.id]);

  // Ürün düzenleme sırasında tüm seçenekleri getir
  useEffect(() => {
    const fetchAllOptions = async () => {
      if (openProductOptionDialog) {
        try {
          setLoading(true);
          const response: {data: ProductOption[]} = await menuService.getOptions();
          // Her seçeneğin values özelliğinin var olduğundan emin ol
          const validatedOptions = (response.data || []).map(option => ({
            ...option,
            values: option.values || []
          }));
          setOptions(validatedOptions);
        } catch (error) {
          console.error('Seçenekler getirilirken hata oluştu:', error);
          setSnackbar({
            open: true,
            message: 'Seçenekler yüklenirken bir hata oluştu',
            severity: 'error'
          });
        } finally {
          setLoading(false);
        }
      }
    };

    fetchAllOptions();
  }, [openProductOptionDialog]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCategorySelect = (categoryId: number | null) => {
    setSelectedCategory(categoryId);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const filteredProducts = products.filter(product => 
    (selectedCategory === null || product.category_id === selectedCategory) &&
    (searchQuery === '' || product.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleProductFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent) => {
    const { name, value } = e.target;
    setProductForm({
      ...productForm,
      [name]: value
    });
  };
  
  const handleCategoryFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCategoryForm({
      ...categoryForm,
      [name]: value
    });
  };

  // Seçenek formu değişiklik işleyicileri
  const handleOptionFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setOptionForm({
      ...optionForm,
      [name]: value
    });
  };

  const handleOptionValueFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const newValue = name === 'price_modifier' ? parseFloat(value) : 
                    name === 'sort_order' ? parseInt(value) : 
                    name === 'is_default' ? (value === 'true') : value;
    
    setOptionValueForm({
      ...optionValueForm,
      [name]: newValue
    });
  };

  const handleOptionSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setOptionForm({
      ...optionForm,
      [name]: checked
    });
  };

  const handleOptionValueSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setOptionValueForm({
      ...optionValueForm,
      [name]: checked
    });
  };

  // Seçenek ekleme ve düzenleme işleyicileri
  const handleAddOption = () => {
    setCurrentOption(null);
    setOptionForm({
      name: '',
      description: '',
      is_active: true
    });
    setOpenOptionDialog(true);
  };

  const handleEditOption = (option: ProductOption) => {
    setCurrentOption(option);
    setOptionForm({
      name: option.name,
      description: option.description || '',
      is_active: option.is_active !== undefined ? option.is_active : true
    });
    setOpenOptionDialog(true);
  };

  const handleSaveOption = async () => {
    try {
      setLoading(true);
      
      if (!optionForm.name) {
        setSnackbar({
          open: true,
          message: 'Seçenek adı girilmelidir',
          severity: 'error'
        });
        return;
      }
      
      let response: {data: ProductOption};
      if (currentOption) {
        // Güncelleme
        response = await menuService.updateOption(currentOption.id, optionForm);
        
        // options dizisini güncelle
        const updatedOptions = options.map(opt => 
          opt.id === currentOption.id ? response.data : opt
        );
        setOptions(updatedOptions);
        
        setSnackbar({
          open: true,
          message: 'Seçenek başarıyla güncellendi',
          severity: 'success'
        });
      } else {
        // Yeni oluşturma
        response = await menuService.createOption(optionForm);
        setOptions([...options, {...response.data, values: []}]);
        
        setSnackbar({
          open: true,
          message: 'Seçenek başarıyla oluşturuldu',
          severity: 'success'
        });
      }
      
      setOpenOptionDialog(false);
    } catch (error) {
      console.error('Seçenek kaydedilirken hata oluştu:', error);
      setSnackbar({
        open: true,
        message: 'Seçenek kaydedilirken bir hata oluştu',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOption = async (optionId: number) => {
    try {
      setLoading(true);
      await menuService.deleteOption(optionId);
      
      // options dizisinden kaldır
      setOptions(options.filter(opt => opt.id !== optionId));
      
      // Eğer seçili option silinmişse seçimi temizle
      if (selectedOption && selectedOption.id === optionId) {
        setSelectedOption(null);
      }
      
      setSnackbar({
        open: true,
        message: 'Seçenek başarıyla silindi',
        severity: 'success'
      });
    } catch (error) {
      console.error('Seçenek silinirken hata oluştu:', error);
      setSnackbar({
        open: true,
        message: 'Seçenek silinirken bir hata oluştu',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Seçenek değeri ekleme, düzenleme, silme
  const handleAddOptionValue = () => {
    if (!selectedOption) return;
    
    setCurrentOptionValue(null);
    setOptionValueForm({
      value: '',
      price_modifier: 0,
      is_default: false,
      sort_order: 0
    });
    setOpenOptionValueDialog(true);
  };

  const handleEditOptionValue = (value: OptionValue) => {
    setCurrentOptionValue(value);
    setOptionValueForm({
      value: value.value || '',
      price_modifier: value.price_modifier || 0,
      is_default: value.is_default !== undefined ? value.is_default : false,
      sort_order: value.sort_order || 0
    });
    setOpenOptionValueDialog(true);
  };

  const handleSaveOptionValue = async () => {
    if (!selectedOption) return;
    
    try {
      setLoading(true);
      
      if (!optionValueForm.value) {
        setSnackbar({
          open: true,
          message: 'Değer metni girilmelidir',
          severity: 'error'
        });
        return;
      }
      
      // API'ye gönderilecek veriyi hazırla, price_modifier'ı sayı olarak gönder
      const formData = {
        ...optionValueForm,
        price_modifier: Number(optionValueForm.price_modifier) || 0,
        sort_order: Number(optionValueForm.sort_order) || 0
      };
      
      let response: {data: OptionValue};
      if (currentOptionValue) {
        // Güncelleme
        response = await menuService.updateOptionValue(currentOptionValue.id, formData);
        
        // selectedOption.values dizisini güncelle
        const updatedValues = (selectedOption.values || []).map(val => 
          val.id === currentOptionValue.id ? response.data : val
        );
        
        const updatedOption = {
          ...selectedOption,
          values: updatedValues
        };
        
        // options dizisini güncelle
        setOptions(options.map(opt => 
          opt.id === selectedOption.id ? updatedOption : opt
        ));
        
        setSelectedOption(updatedOption);
        
        setSnackbar({
          open: true,
          message: 'Seçenek değeri başarıyla güncellendi',
          severity: 'success'
        });
      } else {
        // Yeni oluşturma
        response = await menuService.createOptionValue(selectedOption.id, formData);
        
        const updatedOption = {
          ...selectedOption,
          values: [...(selectedOption.values || []), response.data]
        };
        
        // options dizisini güncelle
        setOptions(options.map(opt => 
          opt.id === selectedOption.id ? updatedOption : opt
        ));
        
        setSelectedOption(updatedOption);
        
        setSnackbar({
          open: true,
          message: 'Seçenek değeri başarıyla oluşturuldu',
          severity: 'success'
        });
      }
      
      setOpenOptionValueDialog(false);
    } catch (error) {
      console.error('Seçenek değeri kaydedilirken hata oluştu:', error);
      setSnackbar({
        open: true,
        message: 'Seçenek değeri kaydedilirken bir hata oluştu',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOptionValue = async (valueId: number) => {
    if (!selectedOption) return;
    
    try {
      setLoading(true);
      await menuService.deleteOptionValue(valueId);
      
      // selectedOption.values dizisinden kaldır
      const updatedOption = {
        ...selectedOption,
        values: (selectedOption.values || []).filter(val => val.id !== valueId)
      };
      
      // options dizisini güncelle
      setOptions(options.map(opt => 
        opt.id === selectedOption.id ? updatedOption : opt
      ));
      
      setSelectedOption(updatedOption);
      
      setSnackbar({
        open: true,
        message: 'Seçenek değeri başarıyla silindi',
        severity: 'success'
      });
    } catch (error) {
      console.error('Seçenek değeri silinirken hata oluştu:', error);
      setSnackbar({
        open: true,
        message: 'Seçenek değeri silinirken bir hata oluştu',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({...snackbar, open: false});
  };

  const handleAddProduct = () => {
    setCurrentProduct(null);
    setProductForm({
      name: '',
      description: '',
      price: 0,
      category_id: '',
      image_url: '',
      is_active: true,
      preparation_time: 5,
      is_available: true,
      sort_order: 0
    });
    setOpenProductDialog(true);
  };

  const handleEditProduct = (product: Product) => {
    setCurrentProduct(product);
    setProductForm({
      name: product.name,
      description: product.description || '',
      price: product.price,
      category_id: product.category_id.toString(),
      image_url: product.image_url || '',
      is_active: product.is_active !== undefined ? product.is_active : true,
      preparation_time: product.preparation_time || 5,
      is_available: product.is_available !== undefined ? product.is_available : true,
      sort_order: product.sort_order || 0
    });
    
    // Ürüne ait seçenekleri getir
    const fetchProductOptions = async () => {
      try {
        setLoading(true);
        const response: {data: ProductOption[]} = await menuService.getProductOptions(product.id);
        
        // Her seçeneğin values özelliğinin var olduğundan emin ol
        const validatedOptions = (response.data || []).map(option => ({
          ...option,
          values: option.values || []
        }));
        
        // Ürün için seçenekleri ayarla
        const updatedProduct = {
          ...product,
          options: validatedOptions
        };
        
        setCurrentProduct(updatedProduct);
      } catch (error) {
        console.error('Ürün seçenekleri getirilirken hata oluştu:', error);
        setSnackbar({
          open: true,
          message: 'Ürün seçenekleri yüklenirken bir hata oluştu',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchProductOptions();
    setOpenProductDialog(true);
  };

  const handleAddCategory = () => {
    setCurrentCategory(null);
    setCategoryForm({
      name: '',
      description: '',
      image_url: '',
      is_active: true,
      sort_order: 0
    });
    setOpenCategoryDialog(true);
  };

  const handleEditCategory = (category: Category) => {
    setCurrentCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      image_url: category.image_url || '',
      is_active: category.is_active !== undefined ? category.is_active : true,
      sort_order: category.sort_order || 0
    });
    setOpenCategoryDialog(true);
  };

  const handleDeleteProduct = async (productId: number) => {
    try {
      // API isteği burada yapılacak
      // await menuService.deleteProduct(productId);
      
      // UI'ı güncelle
      setProducts(products.filter(product => product.id !== productId));
    } catch (error) {
      console.error('Ürün silinirken hata oluştu:', error);
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    try {
      // API isteği burada yapılacak
      // await menuService.deleteCategory(categoryId);
      
      // UI'ı güncelle
      setCategories(categories.filter(category => category.id !== categoryId));
    } catch (error) {
      console.error('Kategori silinirken hata oluştu:', error);
    }
  };

  const handleSaveProduct = async () => {
    setLoading(true);
    try {
      // Ürün ekleme/düzenleme işlemi
      if (currentProduct) {
        // Güncelleme işlemi
        const response: {data: Product} = await menuService.updateProduct(currentProduct.id, {
          ...productForm,
          price: Number(productForm.price),
          category_id: Number(productForm.category_id),
          preparation_time: Number(productForm.preparation_time),
          sort_order: Number(productForm.sort_order)
        });
        
        // Ürün listesini güncelle
        setProducts(products.map(p => 
          p.id === currentProduct.id ? { ...response.data } : p
        ));
      } else {
        // Yeni ürün ekleme işlemi
        const response: {data: Product} = await menuService.createProduct({
          ...productForm,
          price: Number(productForm.price),
          category_id: Number(productForm.category_id),
          preparation_time: Number(productForm.preparation_time),
          sort_order: Number(productForm.sort_order)
        });
        
        // Yeni ürünü listeye ekle
        setProducts([...products, response.data]);
      }
      
      setOpenProductDialog(false);
    } catch (error) {
      console.error('Ürün kaydedilirken hata oluştu:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCategory = async () => {
    try {
      // Kategori ekleme/düzenleme işlemi
      if (currentCategory) {
        // Güncelleme işlemi
        const response: {data: Category} = await menuService.updateCategory(currentCategory.id, {
          ...categoryForm,
          sort_order: Number(categoryForm.sort_order)
        });
        
        // Kategori listesini güncelle
        setCategories(categories.map(c => 
          c.id === currentCategory.id ? response.data : c
        ));
      } else {
        // Yeni kategori ekleme işlemi
        const response: {data: Category} = await menuService.createCategory({
          ...categoryForm,
          sort_order: Number(categoryForm.sort_order)
        });
        
        // Yeni kategoriyi listeye ekle
        setCategories([...categories, response.data]);
      }
      
      setOpenCategoryDialog(false);
    } catch (error) {
      console.error('Kategori kaydedilirken hata oluştu:', error);
    }
  };

  const getCategoryName = (categoryId: number) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Kategori Bulunamadı';
  };

  // Ürüne seçenek ekleme
  const handleAddProductOption = async () => {
    if (!currentProduct || !selectedProductOptionId) return;
    
    try {
      setLoading(true);
      
      const response: {data: any} = await menuService.addProductOption(currentProduct.id, {
        option_id: parseInt(selectedProductOptionId),
        is_required: isRequiredOption
      });
      
      // Seçeneği getir
      const optionResponse: {data: ProductOption} = await menuService.getOptionById(parseInt(selectedProductOptionId));
      const option = optionResponse.data;
      
      // Ürünün options dizisini güncelle
      const updatedProduct = {
        ...currentProduct,
        options: [...(currentProduct.options || []), {
          ...option,
          is_required: isRequiredOption
        }]
      };
      
      setCurrentProduct(updatedProduct);
      
      setSnackbar({
        open: true,
        message: 'Seçenek ürüne başarıyla eklendi',
        severity: 'success'
      });
      
      setOpenProductOptionDialog(false);
      setSelectedProductOptionId('');
      setIsRequiredOption(false);
    } catch (error) {
      console.error('Ürüne seçenek eklenirken hata oluştu:', error);
      setSnackbar({
        open: true,
        message: 'Ürüne seçenek eklenirken bir hata oluştu',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Üründen seçenek silme
  const handleRemoveProductOption = async (productId: number, optionId: number) => {
    try {
      setLoading(true);
      await menuService.removeProductOption(productId, optionId);
      
      // Ürünün options dizisini güncelle
      if (currentProduct) {
        const updatedProduct = {
          ...currentProduct,
          options: (currentProduct.options || []).filter(opt => opt.id !== optionId)
        };
        
        setCurrentProduct(updatedProduct);
      }
      
      setSnackbar({
        open: true,
        message: 'Seçenek üründen başarıyla kaldırıldı',
        severity: 'success'
      });
    } catch (error) {
      console.error('Seçenek üründen kaldırılırken hata oluştu:', error);
      setSnackbar({
        open: true,
        message: 'Seçenek üründen kaldırılırken bir hata oluştu',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Menü Yönetimi</Typography>
        <Box>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={handleAddProduct}
            sx={{ mr: 1 }}
          >
            Yeni Ürün
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<AddIcon />}
            onClick={handleAddCategory}
          >
            Yeni Kategori
          </Button>
        </Box>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          variant="fullWidth"
        >
          <Tab label="Ürünler" />
          <Tab label="Kategoriler" />
          <Tab label="Seçenekler" />
        </Tabs>
      </Paper>

      {/* Ürünler Tab */}
      {tabValue === 0 && (
        <>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Box>
              <Button 
                variant={selectedCategory === null ? 'contained' : 'outlined'} 
                onClick={() => handleCategorySelect(null)}
                sx={{ mr: 1 }}
              >
                Tümü
              </Button>
              
              {categories.map(category => (
                <Button 
                  key={category.id}
                  variant={selectedCategory === category.id ? 'contained' : 'outlined'} 
                  onClick={() => handleCategorySelect(category.id)}
                  sx={{ mr: 1 }}
                >
                  {category.name}
                </Button>
              ))}
            </Box>
            
            <TextField
              size="small"
              placeholder="Ürün ara..."
              value={searchQuery}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          
          <Grid container spacing={3}>
            {filteredProducts.map(product => (
              <Grid item xs={12} sm={6} md={4} key={product.id}>
                <Card>
                  <CardMedia
                    component="img"
                    height="140"
                    image={product.image_url}
                    alt={product.name}
                  />
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="h6" component="div">
                        {product.name}
                      </Typography>
                      <Chip 
                        label={getCategoryName(product.category_id)} 
                        size="small" 
                        color="primary" 
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, minHeight: 40 }}>
                      {product.description}
                    </Typography>
                    <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                      {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(product.price)}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      startIcon={<EditIcon />}
                      onClick={() => handleEditProduct(product)}
                    >
                      Düzenle
                    </Button>
                    <Button 
                      size="small" 
                      color="error" 
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDeleteProduct(product.id)}
                    >
                      Sil
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {/* Kategoriler Tab */}
      {tabValue === 1 && (
        <Paper>
          <List>
            {categories.map(category => (
              <React.Fragment key={category.id}>
                <ListItem>
                  <ListItemText
                    primary={category.name}
                    secondary={category.description}
                  />
                  <ListItemSecondaryAction>
                    <IconButton 
                      edge="end" 
                      aria-label="düzenle" 
                      onClick={() => handleEditCategory(category)}
                      sx={{ mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      edge="end" 
                      aria-label="sil" 
                      color="error"
                      onClick={() => handleDeleteCategory(category.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}

      {/* Ürün Ekleme/Düzenleme Dialog */}
      <Dialog 
        open={openProductDialog} 
        onClose={() => setOpenProductDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {currentProduct ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  margin="normal"
                  label="Ürün Adı"
                  name="name"
                  value={productForm.name}
                  onChange={handleProductFormChange}
                  required
                />
                <TextField
                  fullWidth
                  margin="normal"
                  label="Açıklama"
                  name="description"
                  multiline
                  rows={3}
                  value={productForm.description}
                  onChange={handleProductFormChange}
                />
                <FormControl fullWidth margin="normal">
                  <InputLabel>Kategori</InputLabel>
                  <Select
                    name="category_id"
                    value={productForm.category_id}
                    onChange={handleProductFormChange}
                    required
                  >
                    {categories.map(category => (
                      <MenuItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    margin="normal"
                    label="Resim URL"
                    name="image_url"
                    value={productForm.image_url}
                    onChange={handleProductFormChange}
                    placeholder="https://..."
                  />
                  {productForm.image_url && (
                    <Box 
                      sx={{ 
                        mt: 2, 
                        p: 1, 
                        border: '1px dashed grey',
                        borderRadius: 1,
                        textAlign: 'center' 
                      }}>
                      <img 
                        src={productForm.image_url} 
                        alt="Ürün ön izleme" 
                        style={{ maxWidth: '100%', maxHeight: '120px' }} 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://placehold.co/200x150?text=Resim+Yüklenemedi';
                        }}
                      />
                    </Box>
                  )}
                </Box>
              </Grid>
            </Grid>

            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Fiyat"
                  name="price"
                  type="number"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₺</InputAdornment>,
                    inputProps: { min: 0, step: 0.1 }
                  }}
                  value={productForm.price}
                  onChange={handleProductFormChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Hazırlık Süresi (dk)"
                  name="preparation_time"
                  type="number"
                  InputProps={{
                    inputProps: { min: 1 }
                  }}
                  value={productForm.preparation_time}
                  onChange={handleProductFormChange}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Sıralama"
                  name="sort_order"
                  type="number"
                  InputProps={{
                    inputProps: { min: 0 }
                  }}
                  value={productForm.sort_order}
                  onChange={handleProductFormChange}
                  helperText="Küçük değerler üstte gösterilir"
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={productForm.is_active}
                    onChange={(e) => setProductForm({ ...productForm, is_active: e.target.checked })}
                    name="is_active"
                  />
                }
                label="Aktif (Menüde Gösterilir)"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={productForm.is_available}
                    onChange={(e) => setProductForm({ ...productForm, is_available: e.target.checked })}
                    name="is_available"
                  />
                }
                label="Mevcut (Sipariş Edilebilir)"
              />
            </Box>

            {currentProduct && (
              <Box sx={{ mt: 3 }}>
                <Divider textAlign="left" sx={{ my: 2 }}>Ürün Seçenekleri</Divider>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1">
                    Ürün Seçenekleri
                    <Tooltip title="Kahve şekeri, pişirme seviyesi gibi seçenekler">
                      <IconButton size="small">
                        <HelpOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Typography>
                  
                  <Button 
                    variant="contained"
                    color="primary"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenProductOptionDialog(true)}
                  >
                    Seçenek Ekle
                  </Button>
                </Box>
                
                {currentProduct.options && currentProduct.options.length > 0 ? (
                  <List sx={{ bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                    {currentProduct.options.map(option => (
                      <React.Fragment key={option.id}>
                        <ListItem
                          secondaryAction={
                            <IconButton edge="end" onClick={() => handleRemoveProductOption(currentProduct.id, option.id)}>
                              <DeleteIcon />
                            </IconButton>
                          }
                        >
                          <ListItemIcon>
                            {option.is_required ? (
                              <Tooltip title="Zorunlu seçenek">
                                <CheckCircleIcon color="primary" />
                              </Tooltip>
                            ) : (
                              <FormatListBulletedIcon />
                            )}
                          </ListItemIcon>
                          <ListItemText
                            primary={option.name}
                            secondary={
                              <>
                                {option.values && option.values.length > 0 ? (
                                  <Typography variant="body2" component="span">
                                    {option.values.map(v => v.value).join(', ')}
                                  </Typography>
                                ) : 'Henüz değer yok'}
                              </>
                            }
                          />
                        </ListItem>
                        <Divider variant="inset" component="li" />
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'background.paper' }}>
                    <Typography color="textSecondary">
                      Bu ürüne henüz seçenek eklenmemiş
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                      Seçenekler, müşterinin siparişi özelleştirmesine olanak tanır (ör. Türk kahvesi için şeker miktarı)
                    </Typography>
                  </Paper>
                )}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenProductDialog(false)}>İptal</Button>
          <Button 
            variant="contained" 
            onClick={handleSaveProduct}
            disabled={!productForm.name || !productForm.category_id || productForm.price <= 0 || loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>

      {/* Kategori Ekleme/Düzenleme Dialog */}
      <Dialog 
        open={openCategoryDialog} 
        onClose={() => setOpenCategoryDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {currentCategory ? 'Kategori Düzenle' : 'Yeni Kategori Ekle'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1 }}>
            <TextField
              fullWidth
              margin="normal"
              label="Kategori Adı"
              name="name"
              value={categoryForm.name}
              onChange={handleCategoryFormChange}
              required
            />
            <TextField
              fullWidth
              margin="normal"
              label="Açıklama"
              name="description"
              multiline
              rows={3}
              value={categoryForm.description}
              onChange={handleCategoryFormChange}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Resim URL"
              name="image_url"
              value={categoryForm.image_url}
              onChange={handleCategoryFormChange}
              placeholder="https://..."
            />
            {categoryForm.image_url && (
              <Box 
                sx={{ 
                  mt: 2, 
                  p: 1, 
                  border: '1px dashed grey',
                  borderRadius: 1,
                  textAlign: 'center' 
                }}>
                <img 
                  src={categoryForm.image_url} 
                  alt="Kategori ön izleme" 
                  style={{ maxWidth: '100%', maxHeight: '120px' }} 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://placehold.co/200x150?text=Resim+Yüklenemedi';
                  }}
                />
              </Box>
            )}
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Sıralama"
                  name="sort_order"
                  type="number"
                  InputProps={{
                    inputProps: { min: 0 }
                  }}
                  value={categoryForm.sort_order}
                  onChange={handleCategoryFormChange}
                  helperText="Küçük değerler üstte gösterilir"
                />
              </Grid>
            </Grid>
            <Box sx={{ mt: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={categoryForm.is_active}
                    onChange={(e) => setCategoryForm({ ...categoryForm, is_active: e.target.checked })}
                    name="is_active"
                  />
                }
                label="Aktif (Menüde Gösterilir)"
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCategoryDialog(false)}>İptal</Button>
          <Button 
            variant="contained" 
            onClick={handleSaveCategory}
            disabled={!categoryForm.name}
          >
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>

      {/* Seçenekler Tab */}
      {tabValue === 2 && (
        <Grid container spacing={3}>
          {/* Sol panel - Seçenek Listesi */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Seçenekler</Typography>
                <Button 
                  variant="contained" 
                  startIcon={<AddIcon />} 
                  size="small"
                  onClick={handleAddOption}
                >
                  Yeni Seçenek
                </Button>
              </Box>
              
              <List>
                {loading && options.length === 0 ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                  </Box>
                ) : options.length === 0 ? (
                  <Typography align="center" color="textSecondary" sx={{ p: 2 }}>
                    Henüz bir seçenek eklenmemiş
                  </Typography>
                ) : (
                  options.map(option => (
                    <React.Fragment key={option.id}>
                      <ListItem 
                        button 
                        selected={selectedOption?.id === option.id}
                        onClick={() => setSelectedOption(option)}
                      >
                        <ListItemText 
                          primary={option.name} 
                          secondary={option.description}
                        />
                        <ListItemSecondaryAction>
                          <IconButton edge="end" onClick={() => handleEditOption(option)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton edge="end" onClick={() => handleDeleteOption(option.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))
                )}
              </List>
            </Paper>
          </Grid>
          
          {/* Sağ panel - Seçenek Değerleri */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2, height: '100%' }}>
              {selectedOption ? (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      {selectedOption.name} - Değerler
                    </Typography>
                    <Button 
                      variant="contained" 
                      startIcon={<AddIcon />} 
                      size="small"
                      onClick={handleAddOptionValue}
                    >
                      Yeni Değer
                    </Button>
                  </Box>
                  
                  <List>
                    {loading && (!selectedOption.values || selectedOption.values.length === 0) ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress />
                      </Box>
                    ) : !selectedOption.values || selectedOption.values.length === 0 ? (
                      <Typography align="center" color="textSecondary" sx={{ p: 2 }}>
                        Bu seçenek için henüz bir değer eklenmemiş
                      </Typography>
                    ) : (
                      selectedOption.values.map(value => (
                        <React.Fragment key={value.id}>
                          <ListItem>
                            <ListItemIcon>
                              {value.is_default && (
                                <Tooltip title="Varsayılan seçenek">
                                  <CheckCircleIcon color="success" />
                                </Tooltip>
                              )}
                            </ListItemIcon>
                            <ListItemText 
                              primary={value.value}
                              secondary={value.price_modifier > 0 ? `Fiyat farkı: +${Number(value.price_modifier).toFixed(2)} ₺` : ''}
                            />
                            <ListItemSecondaryAction>
                              <IconButton edge="end" onClick={() => handleEditOptionValue(value)}>
                                <EditIcon />
                              </IconButton>
                              <IconButton edge="end" onClick={() => handleDeleteOptionValue(value.id)}>
                                <DeleteIcon />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                          <Divider />
                        </React.Fragment>
                      ))
                    )}
                  </List>
                </>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Typography variant="body1" color="textSecondary">
                    Sol panelden bir seçenek seçin veya yeni bir seçenek oluşturun
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Seçenek Ekleme/Düzenleme Dialog */}
      <Dialog open={openOptionDialog} onClose={() => setOpenOptionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{currentOption ? 'Seçeneği Düzenle' : 'Yeni Seçenek Ekle'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              margin="normal"
              label="Seçenek Adı"
              name="name"
              value={optionForm.name || ''}
              onChange={handleOptionFormChange}
              required
            />
            <TextField
              fullWidth
              margin="normal"
              label="Açıklama"
              name="description"
              value={optionForm.description || ''}
              onChange={handleOptionFormChange}
              multiline
              rows={2}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={optionForm.is_active !== undefined ? optionForm.is_active : true}
                  onChange={handleOptionSwitchChange}
                  name="is_active"
                  color="primary"
                />
              }
              label="Aktif"
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenOptionDialog(false)} color="inherit">
            İptal
          </Button>
          <Button onClick={handleSaveOption} color="primary" variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Kaydet'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Seçenek Değeri Ekleme/Düzenleme Dialog */}
      <Dialog open={openOptionValueDialog} onClose={() => setOpenOptionValueDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{currentOptionValue ? 'Değeri Düzenle' : 'Yeni Değer Ekle'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              margin="normal"
              label="Değer"
              name="value"
              value={optionValueForm.value || ''}
              onChange={handleOptionValueFormChange}
              required
              helperText="Örneğin: Sade, Orta, Şekerli"
            />
            <TextField
              fullWidth
              margin="normal"
              label="Fiyat Farkı"
              name="price_modifier"
              value={optionValueForm.price_modifier || 0}
              onChange={handleOptionValueFormChange}
              type="number"
              InputProps={{
                startAdornment: <InputAdornment position="start">₺</InputAdornment>,
              }}
              helperText="Bu seçeneğin temel fiyata eklenecek farkı (0 = fark yok)"
            />
            <TextField
              fullWidth
              margin="normal"
              label="Sıralama"
              name="sort_order"
              value={optionValueForm.sort_order || 0}
              onChange={handleOptionValueFormChange}
              type="number"
              helperText="Listede görünme sırası"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={optionValueForm.is_default !== undefined ? optionValueForm.is_default : false}
                  onChange={handleOptionValueSwitchChange}
                  name="is_default"
                  color="primary"
                />
              }
              label="Varsayılan seçenek"
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenOptionValueDialog(false)} color="inherit">
            İptal
          </Button>
          <Button onClick={handleSaveOptionValue} color="primary" variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Kaydet'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Ürüne Seçenek Ekleme Dialog */}
      <Dialog 
        open={openProductOptionDialog} 
        onClose={() => setOpenProductOptionDialog(false)} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>Ürüne Seçenek Ekle</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Seçenek</InputLabel>
              <Select
                value={selectedProductOptionId}
                onChange={(e) => setSelectedProductOptionId(e.target.value as string)}
                required
              >
                {options.map(option => (
                  <MenuItem key={option.id} value={option.id.toString()}>
                    {option.name}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>Eklemek istediğiniz seçeneği seçin</FormHelperText>
            </FormControl>
            
            <FormControlLabel
              control={
                <Switch
                  checked={isRequiredOption}
                  onChange={(e) => setIsRequiredOption(e.target.checked)}
                  name="is_required"
                  color="primary"
                />
              }
              label="Zorunlu seçenek"
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenProductOptionDialog(false)} color="inherit">
            İptal
          </Button>
          <Button onClick={handleAddProductOption} color="primary" variant="contained" disabled={loading || !selectedProductOptionId}>
            {loading ? <CircularProgress size={24} /> : 'Ekle'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar Bildirimleri */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Menu; 