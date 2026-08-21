'use client';
import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col, InputGroup } from 'react-bootstrap';
import { IconTrash, IconPlus } from '@tabler/icons-react';
import { getPemintaListForTools, getToolsList, createOrderTools } from '/services/orderToolsService';

interface OrderToolsFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface OrderItem {
  tool_id: string;
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
  tool_id: '',
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

export default function OrderToolsFormModal({ isOpen, onClose, onSuccess }: OrderToolsFormModalProps) {
  const [peminjamList, setPeminjamList] = useState<any[]>([]);
  const [toolsList, setToolsList] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [pemintaId, setPemintaId] = useState<string>('');
  const [items, setItems] = useState<OrderItem[]>([getEmptyItem()]);
  const [searchTexts, setSearchTexts] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    if (isOpen) {
      getPemintaListForTools().then((res: any) => {
        const data = res?.data?.data || res?.data || res || [];
        setPeminjamList(Array.isArray(data) ? data : []);
      }).catch(console.error);

      getToolsList().then((res: any) => {
        const data = res?.data?.data || res?.data || res || [];
        setToolsList(Array.isArray(data) ? data : []);
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

  const handleSelectTool = (index: number, toolId: string) => {
    const selected = toolsList.find((t) => t.id.toString() === toolId);

    if (selected) {
      const newItems = [...items];
      newItems[index] = {
        ...newItems[index],
        tool_id: toolId,
        kode_barang: selected.kode_barang || selected.kodeBarang || '',
        nama_barang: selected.nama_barang || selected.namaBarang || selected.nama || '',
        merek: selected.merk || selected.merek || '',
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
        const specSummary = `Tipe: ${item.tipe || '-'}, ER/E: ${item.er_e || '-'}, Ukuran: ${item.ukuran || '-'}`;

        const payload = {
          peminta_id: pemintaId,
          tool_id: item.tool_id ? Number(item.tool_id) : null,
          kode_barang: item.kode_barang || null,
          nama_barang: item.nama_barang,
          merek: item.merek || null,
          tipe: item.tipe || null,
          er_e: item.er_e || null,
          ukuran: item.ukuran || null,
          spesifikasi: specSummary,
          jumlah: Number(item.jumlah),
          satuan: item.satuan,
          harga: Number(item.harga),
          referensi_harga: item.referensi_harga || null,
          tanggal_pengajuan: localISOTime,
        };

        return createOrderTools(payload);
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
        <Modal.Title className="h5 mb-0">Buat Order Tools</Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-4">
        <Form id="formOrderTools" onSubmit={handleSubmit}>

          {/* BAGIAN 1: PENGUSUL */}
          <div className="mb-4">
            <Form.Group>
              <Form.Label className="fw-semibold">
                Nama Pengusul <span className="text-danger">*</span>
              </Form.Label>
              <Form.Select required value={pemintaId} onChange={e => setPemintaId(e.target.value)}>
                <option value="" disabled>-- Pilih Nama Pengusul --</option>
                {peminjamList.map((p) => (
                  <option key={p.id} value={p.id}>{p.nama}</option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted">Nama pengusul ini berlaku untuk semua barang di bawah.</Form.Text>
            </Form.Group>
          </div>

          <hr className="mb-4" />

          {/* BAGIAN 2: DAFTAR BARANG */}
          <h6 className="fw-bold mb-3">Daftar Barang yang Dipesan</h6>

          {items.map((item, index) => {
            const currentSearchText = searchTexts[index] !== undefined
              ? searchTexts[index]
              : (item.tool_id ? `${item.kode_barang} — ${item.nama_barang}` : item.nama_barang);

            // Field auto-fill disabled saat tool sudah dipilih dari database
            const isLocked = Boolean(item.tool_id);

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
                      <Form.Label className="fw-semibold">
                        Kode Barang <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        list={`tools-options-${index}`}
                        placeholder="Ketik atau pilih kode/nama barang..."
                        value={currentSearchText}
                        onChange={(e) => {
                          const typed = e.target.value;
                          setSearchTexts((prev) => ({ ...prev, [index]: typed }));

                          const match = toolsList.find(
                            (t) => `${t.kode_barang || t.kodeBarang} — ${t.nama_barang || t.namaBarang || t.nama}` === typed
                          );

                          if (match) {
                            handleSelectTool(index, match.id.toString());
                          } else {
                            const newItems = [...items];
                            newItems[index] = {
                              ...newItems[index],
                              tool_id: '',
                              kode_barang: '',
                              nama_barang: typed,
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
                      <datalist id={`tools-options-${index}`}>
                        {toolsList.map((t) => {
                          const kode = t.kode_barang || t.kodeBarang;
                          const nama = t.nama_barang || t.namaBarang || t.nama;
                          return <option key={t.id} value={`${kode} — ${nama}`} />;
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
                        disabled={isLocked}
                        readOnly={isLocked}
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
                        disabled={isLocked}
                        readOnly={isLocked}
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
                        disabled={isLocked}
                        readOnly={isLocked}
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
                        disabled={isLocked}
                        readOnly={isLocked}
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
                        disabled={isLocked}
                        readOnly={isLocked}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold text-sm">
                        Jumlah <span className="text-danger">*</span>
                      </Form.Label>
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
                      <Form.Label className="fw-semibold text-sm">
                        Satuan <span className="text-danger">*</span>
                      </Form.Label>
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
                      <Form.Label className="fw-semibold text-sm">
                        Estimasi Harga (Satuan) <span className="text-danger">*</span>
                      </Form.Label>
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
                      <Form.Label className="fw-semibold text-sm">
                        Referensi Harga{' '}
                        <span className="text-secondary fw-normal">(opsional)</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        value={item.referensi_harga}
                        onChange={e => handleItemChange(index, 'referensi_harga', e.target.value)}
                        placeholder="Link Tokopedia / Toko"
                      />
                      <Form.Text className="text-muted">
                        Boleh diisi atau dikosongkan.
                      </Form.Text>
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
        <Button variant="primary" type="submit" form="formOrderTools" disabled={isSubmitting}>
          {isSubmitting ? 'Menyimpan...' : 'Simpan Semua Order'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
