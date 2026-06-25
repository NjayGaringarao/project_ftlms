export const PrmsuSignatureBlock = ({
  preparedBy,
  recommendingApproval,
  approvedBy,
  preparedByTitle,
  recommendingApprovalTitle,
  approvedByTitle,
}: {
  preparedBy: string;
  recommendingApproval: string;
  approvedBy: string;
  preparedByTitle?: string;
  recommendingApprovalTitle?: string;
  approvedByTitle?: string;
}) => (
  <div className="mt-4 border-t pt-3 grid grid-cols-3 gap-4 text-xs text-center">
    <div>
      <p className="text-[9px] text-gray-500 mb-4">Prepared:</p>
      <p className="font-bold border-b border-black pb-0.5">{preparedBy}</p>
      <p className="text-[9px]">{preparedByTitle ?? "Campus Director"}</p>
    </div>
    <div>
      <p className="text-[9px] text-gray-500 mb-4">Recommending Approval:</p>
      <p className="font-bold border-b border-black pb-0.5">{recommendingApproval}</p>
      <p className="text-[9px]">{recommendingApprovalTitle ?? "Director for Instruction"}</p>
    </div>
    <div>
      <p className="text-[9px] text-gray-500 mb-4">Approved:</p>
      <p className="font-bold border-b border-black pb-0.5">{approvedBy}</p>
      <p className="text-[9px]">{approvedByTitle ?? "Vice President for Academic Affairs"}</p>
    </div>
  </div>
);
