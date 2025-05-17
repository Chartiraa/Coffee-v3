import React from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, Divider, Box, Typography, Avatar } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import TableRestaurantIcon from '@mui/icons-material/TableRestaurant';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import InventoryIcon from '@mui/icons-material/Inventory';
import PaymentsIcon from '@mui/icons-material/Payments';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import { authService } from '../services/api';

interface SidebarProps {
  drawerWidth: number;
}

const Sidebar: React.FC<SidebarProps> = ({ drawerWidth }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    {
      text: 'Ana Sayfa',
      icon: <DashboardIcon />,
      path: '/'
    },
    {
      text: 'Menü Yönetimi',
      icon: <RestaurantMenuIcon />,
      path: '/menu'
    },
    {
      text: 'Masa Yönetimi',
      icon: <TableRestaurantIcon />,
      path: '/tables'
    },
    {
      text: 'Siparişler',
      icon: <ReceiptIcon />,
      path: '/orders'
    },
    {
      text: 'Yeni Sipariş',
      icon: <AddShoppingCartIcon />,
      path: '/new-order'
    },
    {
      text: 'Stok Yönetimi',
      icon: <InventoryIcon />,
      path: '/inventory'
    },
    {
      text: 'Hesap İşlemleri',
      icon: <PaymentsIcon />,
      path: '/cashier'
    },
    {
      text: 'Kasa Yönetimi',
      icon: <PointOfSaleIcon />,
      path: '/cash-management'
    },
    {
      text: 'Ödemeler',
      icon: <PaymentsIcon />,
      path: '/payments'
    },
    {
      text: 'Raporlar',
      icon: <AssessmentIcon />,
      path: '/reports'
    }
  ];

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: '#fafafa',
          borderRight: '1px solid #e0e0e0'
        },
      }}
    >
      <Box sx={{ 
        height: 64, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        borderBottom: '1px solid #e0e0e0'
      }}>
        <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
          Kafe Yönetimi
        </Typography>
      </Box>

      <List sx={{ mt: 2 }}>
        {menuItems.map((item) => (
          <ListItem 
            button 
            key={item.text}
            onClick={() => navigate(item.path)}
            sx={{ 
              backgroundColor: location.pathname === item.path ? 'rgba(0, 0, 0, 0.08)' : 'transparent',
              borderLeft: location.pathname === item.path ? '4px solid #1976d2' : '4px solid transparent',
              pl: location.pathname === item.path ? 2 : 2.5
            }}
          >
            <ListItemIcon sx={{ color: location.pathname === item.path ? 'primary.main' : 'inherit' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.text} 
              primaryTypographyProps={{ 
                fontWeight: location.pathname === item.path ? 600 : 400 
              }}
            />
          </ListItem>
        ))}
      </List>

      <Box sx={{ flexGrow: 1 }} />

      <List>
        <Divider />
        <ListItem button onClick={() => navigate('/profile')}>
          <ListItemIcon>
            <PersonIcon />
          </ListItemIcon>
          <ListItemText primary="Profil" />
        </ListItem>
        <ListItem button onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Çıkış Yap" />
        </ListItem>
      </List>
    </Drawer>
  );
};

export default Sidebar; 