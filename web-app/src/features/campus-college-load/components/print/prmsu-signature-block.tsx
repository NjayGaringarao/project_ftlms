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
  <table className="w-full border-collapse border-b-2 border-x-2 border-gray-900">
    <tbody>
      <tr className="border-t border-gray-300">
        <td colSpan={3} className="text-[10px]">
          Received [Affix Faculty Signature]:
        </td>
      </tr>
      <tr className="text-[9px] text-start border-t border-gray-900">
        <td className="w-1/3 border-r border-gray-900">Prepared:</td>
        <td className="w-1/3 border-r border-gray-900">
          Recommending Approval:
        </td>
        <td className="w-1/3">Approved:</td>
      </tr>
      <tr className="text-xs text-center border-t border-gray-900">
        <td className="border-r border-gray-900">
          <p className="font-bold mt-4">{preparedBy}</p>
          <p className="text-[10px]">{preparedByTitle ?? "Campus Director"}</p>
        </td>
        <td className="border-r border-gray-900">
          <p className="font-bold mt-4">{recommendingApproval}</p>
          <p className="text-[10px]">
            {recommendingApprovalTitle ?? "Director for Instruction"}
          </p>
        </td>
        <td>
          <p className="font-bold mt-4">{approvedBy}</p>
          <p className="text-[10px]">
            {approvedByTitle ?? "Vice President for Academic Affairs"}
          </p>
        </td>
      </tr>
    </tbody>
  </table>
);
