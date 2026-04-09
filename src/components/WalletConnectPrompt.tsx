import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Wallet } from 'lucide-react';

interface WalletConnectPromptProps {
  open: boolean;
  onClose: () => void;
  onGoToWallet: () => void;
}

export function WalletConnectPrompt({ open, onClose, onGoToWallet }: WalletConnectPromptProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[320px] rounded-2xl bg-[#1A1A1A] border-[#333] text-white p-0 overflow-hidden">
        {/* Top accent stripe */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#BC13FE] to-[#00FFC2]" />

        <div className="p-6 pt-7 text-center space-y-4">
          {/* Icon */}
          <div
            className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(188,19,254,0.15) 0%, rgba(0,255,194,0.15) 100%)',
              border: '1px solid rgba(0,255,194,0.25)',
            }}
          >
            <Wallet className="w-7 h-7" style={{ color: '#00FFC2' }} />
          </div>

          <DialogHeader className="space-y-1.5">
            <DialogTitle className="text-white text-base font-semibold">Wallet Not Connected</DialogTitle>
            <DialogDescription className="text-gray-400 text-sm leading-relaxed">
              A connected wallet is required to receive campaign rewards. Tokens are deposited directly to your wallet upon completion.
            </DialogDescription>
          </DialogHeader>

          {/* Steps */}
          <div className="text-left space-y-3 rounded-xl p-4" style={{ background: '#2C2C2C' }}>
            {[
              'Go to the Assets tab to set up your wallet.',
              'Tap Connect Wallet and confirm your address.',
              'Return here to start earning token rewards.',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <span
                  className="w-5 h-5 rounded-full text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold"
                  style={{
                    background: 'rgba(0,255,194,0.15)',
                    border: '1px solid rgba(0,255,194,0.35)',
                    color: '#00FFC2',
                  }}
                >
                  {i + 1}
                </span>
                <span className="text-xs text-gray-300 leading-relaxed">{step}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 border-[#444] bg-transparent text-gray-300 hover:bg-[#2C2C2C] hover:text-white"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 gradient-earn text-white"
              onClick={() => {
                onClose();
                onGoToWallet();
              }}
            >
              Go to Wallet
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
