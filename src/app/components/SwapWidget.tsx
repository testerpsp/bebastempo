'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useReadContract } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { maxUint256 } from 'viem'

const DEX_ADDRESS = '0xdec0000000000000000000000000000000000000' as `0x${string}`

const TOKENS = {
  pathUSD: '0x20c0000000000000000000000000000000000000' as `0x${string}`,
  AlphaUSD: '0x20c0000000000000000000000000000000000001' as `0x${string}`,
  BetaUSD: '0x20c0000000000000000000000000000000000002' as `0x${string}`,
  ThetaUSD: '0x20c0000000000000000000000000000000000003' as `0x${string}`,
}

const DEX_ABI = [
  {
    type: 'function',
    name: 'swapExactAmountIn',
    stateMutability: 'nonpayable',
    inputs: [
      { type: 'address', name: 'tokenIn' },
      { type: 'address', name: 'tokenOut' },
      { type: 'uint128', name: 'amountIn' },
      { type: 'uint128', name: 'minAmountOut' },
    ],
    outputs: [{ type: 'uint128', name: 'amountOut' }],
  },
  {
    type: 'function',
    name: 'quoteSwapExactAmountIn',
    stateMutability: 'view',
    inputs: [
      { type: 'address', name: 'tokenIn' },
      { type: 'address', name: 'tokenOut' },
      { type: 'uint128', name: 'amountIn' },
    ],
    outputs: [{ type: 'uint128', name: 'amountOut' }],
  },
] as const

const ERC20_ABI = [
  {
    type: 'function',
    name: 'allowance',
    stateMutability: 'view',
    inputs: [
      { type: 'address', name: 'owner' },
      { type: 'address', name: 'spender' },
    ],
    outputs: [{ type: 'uint256', name: '' }],
  },
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { type: 'address', name: 'spender' },
      { type: 'uint256', name: 'amount' },
    ],
    outputs: [{ type: 'bool', name: '' }],
  },
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ type: 'address', name: 'account' }],
    outputs: [{ type: 'uint256', name: '' }],
  },
] as const

// Component terpisah buat balance (FIX HOOKS ERROR!)
function TokenBalance({ 
  tokenAddress, 
  userAddress 
}: { 
  tokenAddress: `0x${string}`
  userAddress: `0x${string}` 
}) {
  const { data: balance } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [userAddress],
  })

  if (!balance) return <span className="text-xs text-gray-500">0.00</span>

  return (
    <span className="text-xs text-gray-400">
      {(Number(balance) / 1e6).toFixed(2)}
    </span>
  )
}

// Custom Dropdown (FIXED - No hooks in loop)
function TokenSelect({ 
  value, 
  onChange, 
  label,
  userAddress
}: { 
  value: keyof typeof TOKENS
  onChange: (token: keyof typeof TOKENS) => void
  label: string
  userAddress?: `0x${string}`
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative shrink-0" style={{ zIndex: isOpen ? 9999 : 1 }}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className="bg-gray-700 text-white px-2 sm:px-3 py-2 rounded-lg flex items-center justify-between gap-1 sm:gap-2 hover:bg-gray-600 active:bg-gray-600 transition w-[100px] sm:w-[130px] text-sm sm:text-base"
      >
        <span className="font-medium truncate">{value}</span>
        <span className="text-xs shrink-0">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50"
            style={{ zIndex: 9998 }}
            onClick={() => setIsOpen(false)}
          />
          
          <div 
            className="absolute top-full mt-1 bg-gray-800 rounded-lg shadow-2xl border border-gray-600 overflow-hidden min-w-[160px] py-1"
            style={{ zIndex: 9999, right: 0 }}
          >
            {Object.entries(TOKENS).map(([token, address]) => (
              <button
                key={token}
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  onChange(token as keyof typeof TOKENS)
                  setIsOpen(false)
                }}
                className={`w-full text-left px-3 py-1.5 hover:bg-gray-700 active:bg-gray-600 transition ${
                  value === token ? 'bg-gray-700/50' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${value === token ? 'text-blue-400' : 'text-white'}`}>
                    {token}
                  </span>
                  {value === token && <span className="text-blue-400 text-xs">✓</span>}
                </div>
                {userAddress && (
                  <div className="mt-0.5">
                    <TokenBalance tokenAddress={address} userAddress={userAddress} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// Slippage Modal
function SlippageModal({ 
  isOpen, 
  onClose, 
  slippage, 
  setSlippage 
}: { 
  isOpen: boolean
  onClose: () => void
  slippage: string
  setSlippage: (val: string) => void
}) {
  const [customValue, setCustomValue] = useState(slippage)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[10000]">
      <div className="bg-gray-800 rounded-2xl p-6 max-w-sm w-full border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white">Slippage Tolerance</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">×</button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2">
            {['0.1', '0.5', '1.0'].map((val) => (
              <button
                key={val}
                onClick={() => setSlippage(val)}
                className={`py-2 px-3 rounded-lg font-medium transition ${
                  slippage === val
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {val}%
              </button>
            ))}
            <button
              onClick={() => setSlippage('auto')}
              className={`py-2 px-3 rounded-lg font-medium transition ${
                slippage === 'auto'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Auto
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="number"
              value={customValue}
              onChange={(e) => {
                setCustomValue(e.target.value)
                setSlippage(e.target.value)
              }}
              placeholder="Custom"
              className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg outline-none border border-gray-600 focus:border-blue-500"
              step="0.1"
            />
            <span className="text-gray-400">%</span>
          </div>

          <p className="text-xs text-gray-500">
            Your transaction will revert if the price changes unfavorably by more than this percentage.
          </p>
        </div>
      </div>
    </div>
  )
}

// Transaction History
interface Transaction {
  hash: string
  tokenIn: string
  tokenOut: string
  amountIn: string
  amountOut: string
  timestamp: number
}

function TransactionHistory() {
  const [txs, setTxs] = useState<Transaction[]>([])

  useEffect(() => {
    const stored = localStorage.getItem('tempo_dex_txs')
    if (stored) setTxs(JSON.parse(stored))
  }, [])

  if (txs.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500 text-sm">
        No recent transactions
      </div>
    )
  }

  return (
    <div className="space-y-2 max-h-[300px] overflow-y-auto">
      {txs.slice(0, 10).map((tx, i) => (
        <div key={i} className="bg-gray-800 p-3 rounded-lg border border-gray-700 text-sm">
          <div className="flex justify-between mb-1">
            <span className="text-blue-400 font-medium">
              {tx.tokenIn} → {tx.tokenOut}
            </span>
            <span className="text-gray-500 text-xs">
              {new Date(tx.timestamp).toLocaleTimeString()}
            </span>
          </div>
          <div className="text-gray-400 text-xs">
            {tx.amountIn} → {tx.amountOut}
          </div>
        </div>
      ))}
    </div>
  )
}

export function SwapWidget() {
  const { address, isConnected } = useAccount()
  const [tokenIn, setTokenIn] = useState<keyof typeof TOKENS>('pathUSD')
  const [tokenOut, setTokenOut] = useState<keyof typeof TOKENS>('AlphaUSD')
  const [amount, setAmount] = useState('')
  const [slippage, setSlippage] = useState('0.5')
  const [showSlippage, setShowSlippage] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: TOKENS[tokenIn],
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, DEX_ADDRESS] : undefined,
    query: { enabled: Boolean(address) },
  })

  const { data: quoteData } = useReadContract({
    address: DEX_ADDRESS,
    abi: DEX_ABI,
    functionName: 'quoteSwapExactAmountIn',
    args: amount && parseFloat(amount) > 0
      ? [TOKENS[tokenIn], TOKENS[tokenOut], BigInt(Math.floor(parseFloat(amount) * 1e6))]
      : undefined,
    query: { enabled: Boolean(amount && parseFloat(amount) > 0) },
  })

  const { writeContract, isPending, isSuccess } = useWriteContract({
    mutation: {
      onSuccess: (hash) => {
        setTimeout(() => refetchAllowance(), 2000)
        
        const tx: Transaction = {
          hash: hash as string,
          tokenIn,
          tokenOut,
          amountIn: amount,
          amountOut: expectedOutput.toFixed(6),
          timestamp: Date.now(),
        }
        const stored = localStorage.getItem('tempo_dex_txs')
        const txs = stored ? JSON.parse(stored) : []
        txs.unshift(tx)
        localStorage.setItem('tempo_dex_txs', JSON.stringify(txs.slice(0, 50)))
      },
    },
  })

  const amountInWei = amount ? BigInt(Math.floor(parseFloat(amount) * 1e6)) : 0n
  const needsApproval = allowance !== undefined && amountInWei > allowance

  const handleApprove = () => {
    writeContract({
      address: TOKENS[tokenIn],
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [DEX_ADDRESS, maxUint256],
    })
  }

  const handleSwap = () => {
    if (!amount || !quoteData) return
    const amountIn = BigInt(Math.floor(parseFloat(amount) * 1e6))
    const slippagePercent = slippage === 'auto' ? 0.5 : parseFloat(slippage)
    const minOut = (quoteData * BigInt(Math.floor((100 - slippagePercent) * 100))) / 10000n

    writeContract({
      address: DEX_ADDRESS,
      abi: DEX_ABI,
      functionName: 'swapExactAmountIn',
      args: [TOKENS[tokenIn], TOKENS[tokenOut], amountIn, minOut],
    })
  }

  const expectedOutput = quoteData ? Number(quoteData) / 1e6 : 0

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-gray-900 via-blue-900 to-purple-900 p-4 sm:p-6 flex flex-col items-center justify-start pt-8 sm:pt-12">
      <div className="w-full max-w-md mb-6 sm:mb-8 text-center">
        <h1 className="text-3xl sm:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2 sm:mb-3">
          Tempo DEX 🚀
        </h1>
        <p className="text-gray-400 text-sm sm:text-base">Swap stablecoins on Tempo Testnet</p>
      </div>

      <div className="w-full max-w-md bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700 p-4 sm:p-6">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-white">Swap</h2>
          <div className="scale-90 sm:scale-100 origin-right">
            <ConnectButton />
          </div>
        </div>

        {isConnected ? (
          <div className="space-y-3 sm:space-y-4">
            <div className="bg-gray-900/50 p-3 sm:p-4 rounded-xl border border-gray-700">
              <label className="text-xs sm:text-sm text-gray-400 block mb-2">From</label>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  placeholder="0.0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="flex-1 bg-transparent text-xl sm:text-2xl text-white outline-none min-w-0"
                  step="any"
                />
                <TokenSelect value={tokenIn} onChange={setTokenIn} label="From" userAddress={address} />
              </div>
            </div>

            <div className="flex justify-center -my-1 sm:-my-2 relative z-10">
              <button
                type="button"
                onClick={() => { const temp = tokenIn; setTokenIn(tokenOut); setTokenOut(temp); }}
                className="bg-gray-700 p-2 sm:p-2.5 rounded-full border-4 border-gray-800 hover:bg-gray-600 active:bg-gray-600 transition text-lg sm:text-xl"
              >
                🔄
              </button>
            </div>

            <div className="bg-gray-900/50 p-3 sm:p-4 rounded-xl border border-gray-700">
              <label className="text-xs sm:text-sm text-gray-400 block mb-2">To</label>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={expectedOutput > 0 ? expectedOutput.toFixed(6) : '0.0'}
                  readOnly
                  className="flex-1 bg-transparent text-xl sm:text-2xl text-white outline-none min-w-0"
                />
                <TokenSelect value={tokenOut} onChange={setTokenOut} label="To" userAddress={address} />
              </div>
            </div>

            <button
              onClick={() => setShowSlippage(true)}
              className="w-full bg-gray-700/50 hover:bg-gray-700 text-gray-300 py-2 rounded-lg text-sm flex items-center justify-between px-4"
            >
              <span>⚙️ Slippage Tolerance</span>
              <span className="text-blue-400 font-medium">
                {slippage === 'auto' ? 'Auto: 0.5%' : `${slippage}%`}
              </span>
            </button>

            {needsApproval ? (
              <button
                type="button"
                onClick={handleApprove}
                disabled={isPending || !amount || parseFloat(amount) <= 0}
                className="w-full bg-yellow-600 hover:bg-yellow-700 active:bg-yellow-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold py-3 sm:py-4 rounded-xl transition text-sm sm:text-base"
              >
                {isPending ? '⏳ Approving...' : `🔓 Approve ${tokenIn}`}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSwap}
                disabled={!amount || isPending || parseFloat(amount) <= 0 || tokenIn === tokenOut}
                className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold py-3 sm:py-4 rounded-xl transition text-sm sm:text-base"
              >
                {isPending ? '⏳ Swapping...' : isSuccess ? '✅ Success!' : 'Swap'}
              </button>
            )}

            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full bg-gray-700/30 hover:bg-gray-700/50 text-gray-300 py-2 rounded-lg text-sm"
            >
              📊 {showHistory ? 'Hide' : 'Show'} Transaction History
            </button>

            {showHistory && <TransactionHistory />}

            {allowance !== undefined && (
              <p className="text-xs text-gray-500 text-center pt-1">
                Allowance: {(Number(allowance) / 1e6).toFixed(2)} {tokenIn}
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12 text-gray-400">
            <p className="text-2xl sm:text-3xl mb-3">👛</p>
            <p className="text-sm sm:text-base">Please connect your wallet to start swapping</p>
          </div>
        )}
      </div>

      <SlippageModal 
        isOpen={showSlippage} 
        onClose={() => setShowSlippage(false)} 
        slippage={slippage}
        setSlippage={setSlippage}
      />
    </div>
  )
}