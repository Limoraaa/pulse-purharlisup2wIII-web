'use client';

import React from 'react';
import {
  RencanaItem,
  MesinSimple,
  AksiCode,
  MONTHS_LONG,
  MONTHS_SHORT,
  ACTION_META,
  isStatusSelesai,
  isStatusTerlewat,
  getRealisasiSlot,
  formatRupiah,
} from './RencanaHelpers';

interface TimelinePemeliharaanProps {
  mesinList: MesinSimple[];
  rencanaList: RencanaItem[];
  selectedYear: number;
  onSelectRencana?: (item: RencanaItem) => void;
  onCellClickAdd?: (mesin: MesinSimple, bulan: number, minggu: number) => void;
}

const TimelinePemeliharaan: React.FC<TimelinePemeliharaanProps> = ({
  mesinList,
  rencanaList,
  selectedYear,
  onSelectRencana,
  onCellClickAdd,
}) => {
  if (mesinList.length === 0) {
    return (
      <div className="text-center py-5 text-muted">
        Tidak ada data mesin yang ditemukan.
      </div>
    );
  }

  return (
    <div className="table-responsive" style={{ overflowX: 'auto' }}>
      <table
        className="table table-bordered mb-0 align-middle"
        style={{
          borderCollapse: 'separate',
          borderSpacing: 0,
          minWidth: '1520px',
        }}
      >
        <thead>
          <tr>
            <th
              rowSpan={2}
              className="py-3 px-4 text-uppercase fw-bold text-muted"
              style={{
                minWidth: '230px',
                maxWidth: '230px',
                position: 'sticky',
                left: 0,
                zIndex: 3,
                backgroundColor: '#f8fafc',
                fontSize: '11px',
                letterSpacing: '0.5px',
                verticalAlign: 'middle',
                borderBottom: '1px solid #e2e8f0',
                borderRight: '1px solid #e2e8f0',
              }}
            >
              KODE & NAMA MESIN
            </th>
            <th
              rowSpan={2}
              className="py-3 px-2 text-uppercase fw-bold text-muted text-center"
              style={{
                minWidth: '95px',
                maxWidth: '95px',
                position: 'sticky',
                left: '230px',
                zIndex: 3,
                backgroundColor: '#f8fafc',
                fontSize: '11px',
                letterSpacing: '0.5px',
                verticalAlign: 'middle',
                borderBottom: '1px solid #e2e8f0',
                borderRight: '2px solid #cbd5e1',
              }}
            >
              BARIS
            </th>
            {MONTHS_SHORT.map((bln, mIdx) => (
              <th
                key={bln}
                colSpan={4}
                className="text-center py-2 fw-bold text-muted"
                style={{
                  fontSize: '11px',
                  backgroundColor: '#f8fafc',
                  borderBottom: '1px solid #e2e8f0',
                  borderRight: mIdx < 11 ? '1px solid #cbd5e1' : undefined,
                }}
              >
                {bln}
              </th>
            ))}
          </tr>
          <tr>
            {MONTHS_SHORT.map((_, mIdx) =>
              [1, 2, 3, 4].map((w) => (
                <th
                  key={`hdr-${mIdx}-w${w}`}
                  className="text-center py-1 text-muted fw-semibold"
                  style={{
                    minWidth: '34px',
                    width: '34px',
                    fontSize: '10px',
                    backgroundColor: '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                    borderRight:
                      w === 4 && mIdx < 11
                        ? '1px solid #cbd5e1'
                        : '1px solid #f1f5f9',
                  }}
                >
                  W{w}
                </th>
              ))
            )}
          </tr>
        </thead>

        <tbody>
          {mesinList.map((mesin) => {
            const jadwalMesin = rencanaList.filter(
              (r) => Number(r.mesin_id) === Number(mesin.id)
            );

            return (
              <React.Fragment key={mesin.id}>
                {/* ================= BARIS 1: RENCANA ================= */}
                <tr style={{ backgroundColor: '#ffffff' }}>
                  <td
                    rowSpan={2}
                    className="py-3 px-4 align-middle"
                    style={{
                      position: 'sticky',
                      left: 0,
                      zIndex: 2,
                      backgroundColor: '#ffffff',
                      borderRight: '1px solid #e2e8f0',
                      borderBottom: '2px solid #cbd5e1',
                    }}
                  >
                    <div
                      className="fw-bold text-dark"
                      style={{ fontSize: '13.5px', lineHeight: '1.3' }}
                    >
                      {mesin.kode_mesin}
                    </div>
                    <div
                      className="text-muted text-truncate mt-1"
                      style={{ maxWidth: '195px', fontSize: '12px' }}
                      title={mesin.nama_mesin}
                    >
                      {mesin.nama_mesin}
                    </div>
                  </td>

                  <td
                    className="py-2 px-2 text-center fw-semibold align-middle"
                    style={{
                      position: 'sticky',
                      left: '230px',
                      zIndex: 2,
                      backgroundColor: '#f8fafc',
                      fontSize: '11px',
                      color: '#334155',
                      borderRight: '2px solid #cbd5e1',
                      borderBottom: '1px dashed #cbd5e1',
                    }}
                  >
                    Rencana
                  </td>

                  {MONTHS_SHORT.map((_, mIdx) => {
                    const bulanNum = mIdx + 1;
                    return [1, 2, 3, 4].map((w) => {
                      const planItems = jadwalMesin.filter(
                        (item) =>
                          Number(item.tahun) === Number(selectedYear) &&
                          Number(item.bulan) === bulanNum &&
                          Number(item.minggu) === w
                      );

                      return (
                        <td
                          key={`plan-${mesin.id}-${bulanNum}-w${w}`}
                          onClick={() => {
                            if (planItems.length === 0 && onCellClickAdd) {
                              onCellClickAdd(mesin, bulanNum, w);
                            }
                          }}
                          className="text-center align-middle p-1"
                          style={{
                            height: '36px',
                            cursor:
                              planItems.length === 0 && onCellClickAdd
                                ? 'pointer'
                                : 'default',
                            borderBottom: '1px dashed #e2e8f0',
                            borderRight:
                              w === 4 && mIdx < 11
                                ? '1px solid #cbd5e1'
                                : '1px dashed #f1f5f9',
                          }}
                        >
                          <div className="d-flex align-items-center justify-content-center gap-1 flex-wrap">
                            {planItems.map((item, idx) => {
                              const code = item.aksi ? item.aksi.toUpperCase() : '?';
                              const isUnknown = code === '?';
                              const terlewat = isStatusTerlewat(item);
                              const selesai = isStatusSelesai(item.status);

                              // FALLBACK AGAR TIDAK CRASH JIKA ADA DATA LAMA SEPERTI "K"
                              const meta = ACTION_META[item.aksi as AksiCode] || { 
                                label: item.aksi || 'Tidak Diketahui', 
                                color: '#94a3b8', 
                                textColor: '#ffffff' 
                              };

                              let bg = '#ffffff';
                              let color = '#1e293b';
                              let border = '1.5px solid #94a3b8';

                              if (terlewat) {
                                bg = '#ef4444';
                                color = '#ffffff';
                                border = 'none';
                              } else if (isUnknown) {
                                bg = '#94a3b8';
                                color = '#ffffff';
                                border = 'none';
                              }

                              const statusText = selesai
                                ? 'Selesai'
                                : terlewat
                                ? 'Terlewat'
                                : 'Terjadwal';

                              return (
                                <span
                                  key={`plan-badge-${item.id}-${idx}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectRencana && onSelectRencana(item);
                                  }}
                                  title={`[RENCANA] ${meta.label}\nJadwal: ${
                                    MONTHS_LONG[mIdx]
                                  } ${item.tahun} - W${item.minggu}\nStatus: ${statusText}${
                                    item.rab ? `\nRAB: ${formatRupiah(item.rab)}` : ''
                                  }${
                                    item.keterangan ? `\nKet: ${item.keterangan}` : ''
                                  }`}
                                  className="d-inline-flex align-items-center justify-content-center fw-bold rounded-2"
                                  style={{
                                    width: '20px',
                                    height: '20px',
                                    fontSize: '10px',
                                    backgroundColor: bg,
                                    color: color,
                                    border: border,
                                    cursor: 'pointer',
                                  }}
                                >
                                  {code}
                                </span>
                              );
                            })}
                          </div>
                        </td>
                      );
                    });
                  })}
                </tr>

                {/* ================= BARIS 2: REALISASI ================= */}
                <tr style={{ backgroundColor: '#fcfcfd' }}>
                  <td
                    className="py-2 px-2 text-center fw-semibold align-middle"
                    style={{
                      position: 'sticky',
                      left: '230px',
                      zIndex: 2,
                      backgroundColor: '#f1f5f9',
                      fontSize: '11px',
                      color: '#15803d',
                      borderRight: '2px solid #cbd5e1',
                      borderBottom: '2px solid #cbd5e1',
                    }}
                  >
                    Realisasi
                  </td>

                  {MONTHS_SHORT.map((_, mIdx) => {
                    const bulanNum = mIdx + 1;
                    return [1, 2, 3, 4].map((w) => {
                      const actualItems = jadwalMesin.filter((item) => {
                        const slot = getRealisasiSlot(item);
                        if (!slot) return false;
                        return (
                          slot.tahun === Number(selectedYear) &&
                          slot.bulan === bulanNum &&
                          slot.minggu === w
                        );
                      });

                      return (
                        <td
                          key={`actual-${mesin.id}-${bulanNum}-w${w}`}
                          className="text-center align-middle p-1"
                          style={{
                            height: '36px',
                            backgroundColor: '#f8fafc',
                            borderBottom: '2px solid #cbd5e1',
                            borderRight:
                              w === 4 && mIdx < 11
                                ? '1px solid #cbd5e1'
                                : '1px dashed #f1f5f9',
                          }}
                        >
                          <div className="d-flex align-items-center justify-content-center gap-1 flex-wrap">
                            {actualItems.map((item, idx) => {
                              const code = item.aksi ? item.aksi.toUpperCase() : '?';
                              const isUnknown = code === '?';
                              const slot = getRealisasiSlot(item);

                              const meta = ACTION_META[item.aksi as AksiCode] || { 
                                label: item.aksi || 'Tidak Diketahui', 
                              };

                              return (
                                <span
                                  key={`actual-badge-${item.id}-${idx}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectRencana && onSelectRencana(item);
                                  }}
                                  title={`[REALISASI - SELESAI] ${meta.label}\nRencana: ${
                                    MONTHS_LONG[Number(item.bulan) - 1]
                                  } W${item.minggu}\nRealisasi: ${
                                    MONTHS_LONG[mIdx]
                                  } W${w}${
                                    slot?.tanggalFormatted
                                      ? ` (${slot.tanggalFormatted})`
                                      : ''
                                  }${
                                    item.keterangan
                                      ? `\nKet: ${item.keterangan}`
                                      : ''
                                  }`}
                                  className="d-inline-flex align-items-center justify-content-center fw-bold rounded-2"
                                  style={{
                                    width: '20px',
                                    height: '20px',
                                    fontSize: '10px',
                                    backgroundColor: isUnknown ? '#94a3b8' : '#16a34a', // Hijau Selesai
                                    color: '#ffffff',
                                    cursor: 'pointer',
                                  }}
                                >
                                  {code}
                                </span>
                              );
                            })}
                          </div>
                        </td>
                      );
                    });
                  })}
                </tr>
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TimelinePemeliharaan;