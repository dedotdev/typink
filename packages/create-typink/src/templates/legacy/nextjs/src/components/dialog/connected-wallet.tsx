import { useTypink } from 'typink';

export default function ConnectedWallet() {
  const { connectedWallet } = useTypink();

  return (
    <div className="flex items-center gap-3 justify-center pb-2">
      <img
        src={connectedWallet?.logo}
        alt={connectedWallet?.name}
        width={24}
        height={24}
      />
      <span className="font-semibold text-sm">
        {connectedWallet?.name} - v{connectedWallet?.version}
      </span>
    </div>
  );
}
