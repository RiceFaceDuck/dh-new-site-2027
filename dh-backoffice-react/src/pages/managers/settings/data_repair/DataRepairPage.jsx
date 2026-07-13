import DataRepairForm from './DataRepairForm';
import DataRepairGuide from './DataRepairGuide';
import { useDataRepair } from './useDataRepair';
import { DatabaseZap } from 'lucide-react';

const DataRepairPage = () => {
  const repairHook = useDataRepair();

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Section */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-xl">
            <DatabaseZap size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Data Repair System</h1>
            <p className="text-gray-500 mt-1">
              ระบบตรวจสอบและซ่อมแซมฐานข้อมูลเชิงลึก
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Interface */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 h-full">
            <DataRepairForm hookData={repairHook} />
          </div>
        </div>

        {/* Documentation / Guide */}
        <div className="lg:col-span-1">
          <DataRepairGuide />
        </div>
      </div>
    </div>
  );
};

export default DataRepairPage;
