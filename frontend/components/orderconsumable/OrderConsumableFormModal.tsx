'use client';
import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col } from 'react-bootstrap';
import { IconTrash, IconPlus } from '@tabler/icons-react';

import { 
  getPemintaListForConsumable, 
  getConsumableList, 
  createOrderConsumable 
} from '/services/orderConsumableService';
import { useFeedback } from "components/common/FeedbackProvider";
import SearchableInput, { SearchableOption, keteranganBarang } from "components/common/SearchableInput";

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
}

// Teks utama consumable di kotak pencarian & isi input setelah dipilih
const labelConsumable = (c: any) =>
  `${c.kode_barang || c.kodeBarang} — ${c.nama_barang || c.namaBarang || c.nama}`;


const getEmptyItem = (): OrderItem => ({
  consumable_id: '',
  kode_barang: '',
  nama_barang: '',
  merek: '',
  tipe: '',
  er_e: '',
  ukuran: '',
  jumlah: 1,
  satuan: '',
});

export default function OrderConsumableFormModal({ isOpen, onClose, onSuccess }: OrderConsumableFormModalProps) {
  const { notify } = useFeedback();
  const [peminjamList, setPeminjamList] = useState<any[]>([]);
  const [consumableList, setConsumableList] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [pemintaId, setPemintaId] = useState<string>('');
  const [pemintaText, setPemintaText] = useState<string>('');
  const [pemintaInvalid, setPemintaInvalid] = useState(false);
  const [pekerjaan, setPekerjaan] = useState<string>(''); // <-- STATE UNTUK PEKERJAAN GLOBAL
  const [items, setItems] = useState<OrderItem[]>([getEmptyItem()]);
  const [searchTexts, setSearchTexts] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    if (isOpen) {
      getPemintaListForConsumable().then((res: any) => {
        const data = res?.data?.data || res?.data || res || [];
        setPeminjamList(Array.isArray(data) ? data : []);
      }).catch(console.error);

      getConsumableList().then((res: any) => {
        const data = res?.data?.data || res?.data || res || [];
        setConsumableList(Array.isArray(data) ? data : []);
      }).catch(console.error);

      setPemintaId('');
      setPemintaText('');
      setPemintaInvalid(false);
      setPekerjaan(''); // Reset pekerjaan saat modal dibuka
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
    const selected = consumableList.find((c) => c.id.toString() === consumableId);

    if (selected) {
      const newItems = [...items];
      newItems[index] = {
        ...newItems[index],
        consumable_id: consumableId,
        kode_barang: selected.kode_barang || selected.kodeBarang || '',
        nama_barang: selected.nama_barang || selected.namaBarang || selected.nama || '',
        merek: selected.merk || selected.merek || '',
        tipe: selected.tipe || selected.type || '',
        er_e: selected.er_e || selected.ere || '',
        ukuran: selected.ukuran || '',
        satuan: selected.satuan || 'Pcs',
      };
      setItems(newItems);
    }
  };

  const pemintaOptions: SearchableOption[] = peminjamList.map((p) => ({
    value: String(p.id),
    label: p.nama,
    description: p.divisi || undefined,
  }));

  const consumableOptions: SearchableOption[] = consumableList.map((c) => ({
    value: String(c.id),
    label: labelConsumable(c),
    description: keteranganBarang({ merk: c.merk || c.merek, tipe: c.tipe || c.type, er_e: c.er_e, ukuran: c.ukuran }),
  }));

  // Saat mengetik: nama pengusul baru sah kalau sama persis (tanpa beda huruf besar/kecil)
  // dengan tepat satu nama di daftar; selain itu pengguna harus memilih dari daftar.
  const handlePemintaInput = (text: string) => {
    setPemintaText(text);
    setPemintaInvalid(false);
    const cocok = peminjamList.filter((p) => (p.nama || '').toLowerCase() === text.trim().toLowerCase());
    setPemintaId(cocok.length === 1 ? String(cocok[0].id) : '');
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
    if (!pemintaId) {
      setPemintaInvalid(true);
      return;
    }
    setIsSubmitting(true);

    const tzOffset = (new Date()).getTimezoneOffset() * 60000;
    const localISOTime = (new Date(Date.now() - tzOffset)).toISOString().slice(0, 19).replace('T', ' ');

    try {
      const promises = items.map(item => {
        const specSummary = `Tipe: ${item.tipe || '-'}, ER/E: ${item.er_e || '-'}, Ukuran: ${item.ukuran || '-'}`;

        const payload = {
          peminta_id: pemintaId,
          consumable_id: item.consumable_id || null, // UUID, jangan diubah ke angka
          kode_barang: item.kode_barang || null,
          nama_barang: item.nama_barang,
          merek: item.merek || null,
          tipe: item.tipe || null,
          er_e: item.er_e || null,
          ukuran: item.ukuran || null,
          pekerjaan: pekerjaan || null, // <-- AMBIL DARI STATE GLOBAL
          spesifikasi: specSummary,
          jumlah: Number(item.jumlah),
          satuan: item.satuan,
          tanggal_pengajuan: localISOTime,
        };

        return createOrderConsumable(payload);
      });

      await Promise.all(promises);

      onSuccess();
      onClose();
    } catch {
      notify('Gagal menyimpan data order. Pastikan semua field terisi dengan benar.');
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

          {/* BAGIAN 1: PENGUSUL & PEKERJAAN (GLOBAL) */}
          <div className="mb-4">
            <Row className="g-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    Nama Pengusul <span className="text-danger">*</span>
                  </Form.Label>
                  <SearchableInput
                    options={pemintaOptions}
                    inputValue={pemintaText}
                    onInputChange={handlePemintaInput}
                    onSelect={(o) => {
                      setPemintaId(o.value);
                      setPemintaText(o.label);
                      setPemintaInvalid(false);
                    }}
                    placeholder="Ketik untuk mencari nama pengusul..."
                    isInvalid={pemintaInvalid}
                  />
                  {pemintaInvalid ? (
                    <div className="invalid-feedback d-block">Pilih nama pengusul dari daftar.</div>
                  ) : (
                    <Form.Text className="text-muted">Nama pengusul ini berlaku untuk semua barang di bawah.</Form.Text>
                  )}
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Pekerjaan</Form.Label>
                  <Form.Control
                    type="text"
                    value={pekerjaan}
                    onChange={e => setPekerjaan(e.target.value)}
                    placeholder="Keterangan pekerjaan / proyek..."
                  />
                  <Form.Text className="text-muted">Pekerjaan ini berlaku untuk semua barang yang dipesan di bawah.</Form.Text>
                </Form.Group>
              </Col>
            </Row>
          </div>

          <hr className="mb-4" />

          {/* BAGIAN 2: DAFTAR BARANG */}
          <h6 className="fw-bold mb-3">Daftar Consumable yang Dipesan</h6>

          {items.map((item, index) => {
            const currentSearchText = searchTexts[index] !== undefined
              ? searchTexts[index]
              : (item.consumable_id ? labelConsumable(item) : item.nama_barang);

            // Field auto-fill disabled saat consumable sudah dipilih dari database
            const isLocked = Boolean(item.consumable_id);

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
                      <SearchableInput
                        options={consumableOptions}
                        placeholder="Ketik atau pilih kode/nama consumable..."
                        inputValue={currentSearchText}
                        onSelect={(o) => {
                          setSearchTexts((prev) => ({ ...prev, [index]: o.label }));
                          handleSelectConsumable(index, o.value);
                        }}
                        onInputChange={(typed) => {
                          setSearchTexts((prev) => ({ ...prev, [index]: typed }));

                          const match = consumableList.find((c) => labelConsumable(c) === typed);

                          if (match) {
                            handleSelectConsumable(index, match.id.toString());
                          } else {
                            const newItems = [...items];
                            newItems[index] = {
                              ...newItems[index],
                              consumable_id: '',
                              kode_barang: '',
                              nama_barang: typed,
                              merek: '',
                              tipe: '',
                              er_e: '',
                              ukuran: '',
                              satuan: 'Pcs',
                            };
                            setItems(newItems);
                          }
                        }}
                      />
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
                        onChange={e => {
                          const raw = e.target.value.replace(/^0+(?=\d)/, '');
                          handleItemChange(index, 'jumlah', raw === '' ? '' : Number(raw));
                        }}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold text-sm">
                        Satuan <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Select
                        required
                        value={item.satuan}
                        onChange={e => handleItemChange(index, 'satuan', e.target.value)}
                      >
                        <option value="" disabled>Pilih satuan</option>
                        <option value="Pcs">Pcs</option>
                        <option value="Kg">Kg</option>
                        <option value="Meter">Meter</option>
                      </Form.Select>
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