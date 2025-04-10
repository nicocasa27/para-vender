
interface StoreFilterNoticeProps {
  storeFilter: string | null;
  getStoreName: () => string;
}

export function StoreFilterNotice({ storeFilter, getStoreName }: StoreFilterNoticeProps) {
  if (!storeFilter) return null;
  
  return (
    <div className="bg-muted/30 rounded-lg p-2 px-4 flex items-center">
      <p className="text-sm">
        Mostrando productos en: <span className="font-medium">{getStoreName()}</span>
      </p>
    </div>
  );
}
