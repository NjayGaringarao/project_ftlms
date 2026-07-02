const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => {
  return (
    <tr>
      <td className="text-[9px] font-bold leading-tight align-top pr-1">
        {label}
      </td>
      <td className="text-[9px] leading-tight align-top px-0.5">:</td>
      <td className="text-[9px] leading-tight align-top">{value}</td>
    </tr>
  );
};

export default InfoRow;
