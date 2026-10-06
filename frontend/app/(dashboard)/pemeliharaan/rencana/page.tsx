import RencanaPemeliharaanManager from '/components/pemeliharaanmesin/RencanaPemeliharaanManager';

export const metadata = {
  title: 'Rencana Pemeliharaan | PULSE-PUSHARLIS',
};

export default function RencanaPemeliharaanPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Rencana Pemeliharaan Mesin</h1>
        <p className="text-gray-500 text-sm mt-1">Kelola dan pantau jadwal preventive maintenance mesin.</p>
      </div>
      <RencanaPemeliharaanManager />
    </div>
  );
}