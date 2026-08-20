'use client';
import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col, InputGroup } from 'react-bootstrap';
import { IconTrash, IconPlus } from '@tabler/icons-react';
import { getPemintaList, getConsumableList, createOrderConsumable } from '/services/orderConsumableService';

interface OrderConsumableFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface OrderItem {
  consumable_id: string;
  kode_barang: string;
  nama_barang: string;
  merek: string;
  tipe: string;
  er_e: string;
  ukuran: string;
  jumlah: number;
  satuan: string;
  harga: number;
  referensi_harga: string;
}

const getEmptyItem = (): OrderItem => ({
  consumable_id: '',
  kode_barang: '',
  nama_barang: '',
  merek: '',
  tipe: '',
  er_e: '',
  ukuran: '',
  jumlah: 1,
  satuan: 'Pcs',
  harga: 0,
  referensi_harga: '',
});

export default function OrderConsumableFormModal({ isOpen, onClose, onSuccess }: OrderConsumableFormModalProps) {
  const [peminjamList, setPeminjamList] = useState<any[]>([]);
  const [consumablesList, setConsumablesList] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [pemintaId, setPemintaId] = useState<string>('');
  const [items, setItems] = useState<OrderItem[]>([getEmptyItem()]);
  const [searchTexts, setSearchTexts] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    if (isOpen) {
      getPemintaList().then((res: any) => {
        const data = res?.data?.data || res?.data || res || [];
        setPeminjamList(Array.isArray(data) ? data : []);
      }).catch(console.error);
      
      getConsumableList().then((res: any) => {
        const data = res?.data?.data || res?.data || res || [];
        setConsumablesList(Array.isArray(data) ? data : []);
      }).catch(console.error);

      setPemintaId('');
      setItems([getEmptyItem()]);
      setSearchTexts({});
    }
  }, [isOpen]);

  const handleItemChange = (index: number, field: keyof OrderItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSelectConsumable = (index: number, consumableId: string) => {
    const selected = consumablesList.find((c) => c.id.toString() === consumableId);
    
    if (selected) {
      // ALAT DETEKSI: Cek tab Console di Inspect Element!
      console.log("CEK DATA BARANG DARI DATABASE:", selected);

      const newItems = [...items];
      newItems[index] = {
        ...newItems[index],
        consumable_id: consumableId,
        kode_barang: selected.kode_barang || '',
        nama_barang: selected.nama_consumable || selected.nama_barang || selected.nama || '',
        merek: selected.merk || selected.merek || '',
        
        // Coba kita pastikan tarik dari berbagai kemungkinan nama kolom
        tipe: selected.tipe || selected.type || '', 
        
        er_e: selected.er_e || selected.ere || '',
        ukuran: selected.ukuran || '',
        satuan: selected.satuan || 'Pcs',
        harga: selected.harga || 0,
      };
      setItems(newItems);
    }
  };

  const handleAddItem = () => {
    setItems([...items, getEmptyItem()]);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    
    const newTexts = { ...searchTexts };
    delete newTexts[index];
    setSearchTexts(newTexts);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const tzOffset = (new Date()).getTimezoneOffset() * 60000;
    const localISOTime = (new Date(Date.now() - tzOffset)).toISOString().slice(0, 19).replace('T', ' ');

    try {
      const promises = items.map(item => {
        // Gabungkan spesifikasi untuk jaga-jaga
        const specSummary = `Tipe: ${item.tipe || '-'}, ER/E: ${item.er_e || '-'}, Ukuran: ${item.ukuran || '-'}`;

        const payload = {
          peminta_id: pemintaId,
          // PASTIKAN consumable_id diubah menjadi Angka (Number), bukan String. Jika kosong, jadikan null.
          consumable_id: item.consumable_id ? Number(item.consumable_id) : null,
          
          // Masukkan semua field baru agar terkirim ke Laravel!
          kode_barang: item.kode_barang || null,
          nama_barang: item.nama_barang,
          merek: item.merek || null,
          tipe: item.tipe || null,
          er_e: item.er_e || null,
          ukuran: item.ukuran || null,
          spesifikasi: specSummary,
          
          // Pastikan jumlah dan harga dikirim sebagai angka mutlak
          jumlah: Number(item.jumlah),
          satuan: item.satuan,
          harga: Number(item.harga),
          referensi_harga: item.referensi_harga || null,
          tanggal_pengajuan: localISOTime,
        };
        
        return createOrderConsumable(payload);
      });

      await Promise.all(promises);

      onSuccess();
      onClose();
    } catch (error) {
      alert('Gagal menyimpan data order. Pastikan semua field terisi dengan benar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={isOpen} onHide={onClose} centered backdrop="static" size="lg" scrollable>
      <Modal.Header closeButton className="bg-light">
        <Modal.Title className="h5 mb-0">Buat Order Consumable</Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="p-4">
        <Form id="formOrderConsumable" onSubmit={handleSubmit}>
          
          {/* BAGIAN 1: PENGUSUL */}
          <div className="mb-4">
            <Form.Group>
              <Form.Label className="fw-semibold">Nama Pengusul</Form.Label>
              <Form.Select required value={pemintaId} onChange={e => setPemintaId(e.target.value)}>
                <option value="" disabled>-- Pilih Nama Pengusul --</option>
                {peminjamList.map((p) => (
                  <option key={p.id} value={p.id}>{p.nama}</option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted">Nama pengusul ini akan berlaku untuk semua barang di bawah.</Form.Text>
            </Form.Group>
          </div>

          <hr className="mb-4" />

          {/* BAGIAN 2: DAFTAR BARANG */}
          <h6 className="fw-bold mb-3">Daftar Barang yang Dipesan</h6>
          
          {items.map((item, index) => {
            const currentSearchText = searchTexts[index] !== undefined 
              ? searchTexts[index] 
              : (item.consumable_id ? `${item.kode_barang} — ${item.nama_barang}` : item.nama_barang);

            return (
              <div key={index} className="p-3 mb-3 border rounded bg-white position-relative shadow-sm">
                <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                  <span className="fw-bold text-primary">Barang #{index + 1}</span>
                  {items.length > 1 && (
                    <Button variant="outline-danger" size="sm" onClick={() => handleRemoveItem(index)}>
                      <IconTrash size={16} className="me-1" /> Hapus
                    </Button>
                  )}
                </div>

                <Row className="g-3">
                  <Col md={12}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Kode Barang</Form.Label>
                      <Form.Control
                        list={`consumable-options-${index}`}
                        placeholder="Ketik atau pilih kode/nama barang..."
                        value={currentSearchText}
                        onChange={(e) => {
                          const typed = e.target.value;
                          setSearchTexts((prev) => ({ ...prev, [index]: typed }));

                          const match = consumablesList.find(
                            (c) => `${c.kode_barang} — ${c.nama_consumable || c.nama_barang || c.nama}` === typed
                          );

                          if (match) {
                            handleSelectConsumable(index, match.id.toString());
                          } else {
                            // Manual / Barang baru
                            const newItems = [...items];
                            newItems[index] = {
                              ...newItems[index],
                              consumable_id: '',
                              kode_barang: '',
                              // Kosongkan field di bawahnya jika user mengetik sesuatu yang tidak ada di DB
                              nama_barang: '',
                              merek: '',
                              tipe: '',
                              er_e: '',
                              ukuran: '',
                              satuan: 'Pcs',
                              harga: 0,
                            };
                            setItems(newItems);
                          }
                        }}
                      />
                      <datalist id={`consumable-options-${index}`}>
                        {consumablesList.map((c) => {
                          const namaC = c.nama_consumable || c.nama_barang || c.nama;
                          return <option key={c.id} value={`${c.kode_barang} — ${namaC}`} />;
                        })}
                      </datalist>
                      <Form.Text className="text-muted">
                        Pilih dari daftar database, atau ketik bebas untuk barang baru.
                      </Form.Text>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Nama Barang</Form.Label>
                      <Form.Control 
                        value={item.nama_barang} 
                        onChange={e => handleItemChange(index, 'nama_barang', e.target.value)} 
                        placeholder="Nama barang..." 
                        required 
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Merk</Form.Label>
                      <Form.Control 
                        value={item.merek} 
                        onChange={e => handleItemChange(index, 'merek', e.target.value)} 
                        placeholder="Merk barang..." 
                        required 
                      />
                    </Form.Group>
                  </Col>

                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Tipe</Form.Label>
                      <Form.Control 
                        value={item.tipe} 
                        onChange={e => handleItemChange(index, 'tipe', e.target.value)} 
                        placeholder="Tipe..." 
                      />
                    </Form.Group>
                  </Col>

                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>ER / E</Form.Label>
                      <Form.Control 
                        value={item.er_e} 
                        onChange={e => handleItemChange(index, 'er_e', e.target.value)} 
                        placeholder="ER/E..." 
                      />
                    </Form.Group>
                  </Col>

                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Ukuran</Form.Label>
                      <Form.Control 
                        value={item.ukuran} 
                        onChange={e => handleItemChange(index, 'ukuran', e.target.value)} 
                        placeholder="Ukuran..." 
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold text-sm">Jumlah</Form.Label>
                      <Form.Control 
                        type="number" 
                        min="1" 
                        required 
                        value={item.jumlah} 
                        onChange={e => handleItemChange(index, 'jumlah', Number(e.target.value))} 
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold text-sm">Satuan</Form.Label>
                      <Form.Control 
                        type="text" 
                        required 
                        value={item.satuan} 
                        onChange={e => handleItemChange(index, 'satuan', e.target.value)} 
                        placeholder="Cth: Kg, Dus, Pcs" 
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold text-sm">Estimasi Harga (Satuan)</Form.Label>
                      <InputGroup>
                        <InputGroup.Text>Rp</InputGroup.Text>
                        <Form.Control 
                          type="number" 
                          required 
                          value={item.harga || ''} 
                          onChange={e => handleItemChange(index, 'harga', Number(e.target.value))} 
                          placeholder="850000" 
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold text-sm">Referensi Harga</Form.Label>
                      <Form.Control 
                        type="text" 
                        value={item.referensi_harga} 
                        onChange={e => handleItemChange(index, 'referensi_harga', e.target.value)} 
                        placeholder="Link Tokopedia / Toko" 
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </div>
            );
          })}

          <Button variant="outline-primary" className="w-100 d-flex justify-content-center align-items-center border-dashed mt-2" onClick={handleAddItem}>
            <IconPlus size={18} className="me-2" /> Tambah Barang Lainnya
          </Button>

        </Form>
      </Modal.Body>
      
      <Modal.Footer className="bg-light">
        <Button variant="outline-secondary" onClick={onClose} disabled={isSubmitting}>Batal</Button>
        <Button variant="primary" type="submit" form="formOrderConsumable" disabled={isSubmitting}>
          {isSubmitting ? 'Menyimpan...' : 'Simpan Semua Order'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}