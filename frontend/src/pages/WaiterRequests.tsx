import React, { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { io } from 'socket.io-client';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

interface WaiterRequest {
  id: number;
  table_id: number;
  status: 'pending' | 'done';
  created_at: string;
  updated_at: string;
}

const WaiterRequests: React.FC = () => {
  const [requests, setRequests] = useState<WaiterRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/v1/waiter-calls`);
      if (!response.ok) {
        throw new Error('API yanıt vermedi');
      }
      const data = await response.json();
      setRequests(data);
    } catch (error) {
      console.error('Bildirimler yüklenirken bir hata oluştu:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: number, newStatus: 'done') => {
    try {
      const response = await fetch(`${API_URL}/api/v1/waiter-calls/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) {
        throw new Error('Durum güncellenemedi');
      }
      fetchRequests();
    } catch (error) {
      console.error('Durum güncellenirken bir hata oluştu:', error);
    }
  };

  const getStatusChip = (status: string) => {
    const statusConfig = {
      pending: { color: 'warning', label: 'Beklemede' },
      done: { color: 'success', label: 'Tamamlandı' },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <Chip
        label={config.label}
        color={config.color as 'warning' | 'success'}
        size="small"
      />
    );
  };

  useEffect(() => {
    // Socket.IO bağlantısını başlat
    const socket = io(API_URL);

    // Garson çağırma odasına katıl
    socket.emit('join-waiter-calls-room');

    // Socket.IO olaylarını dinle
    socket.on('waiterRequest', (newRequest: WaiterRequest) => {
      setRequests(prevRequests => {
        // Eğer aynı ID'ye sahip bir istek varsa güncelle, yoksa yeni ekle
        const exists = prevRequests.some(req => req.id === newRequest.id);
        if (exists) {
          return prevRequests.map(req => 
            req.id === newRequest.id ? newRequest : req
          );
        }
        return [newRequest, ...prevRequests];
      });
    });

    // İlk yükleme
    fetchRequests();

    // Component unmount olduğunda socket bağlantısını kapat
    return () => {
      socket.disconnect();
    };
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Garson Çağırma Bildirimleri
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Masa No</TableCell>
              <TableCell>Durum</TableCell>
              <TableCell>Tarih</TableCell>
              <TableCell>İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>{request.table_id}</TableCell>
                <TableCell>{getStatusChip(request.status)}</TableCell>
                <TableCell>
                  {format(new Date(request.created_at), 'dd MMMM yyyy HH:mm', { locale: tr })}
                </TableCell>
                <TableCell>
                  {request.status === 'pending' && (
                    <Box>
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => handleStatusChange(request.id, 'done')}
                        sx={{ mr: 1 }}
                      >
                        Tamamla
                      </Button>
                    </Box>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default WaiterRequests; 