'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js'
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  Boxes,
  ChevronDown,
  CircleHelp,
  CreditCard,
  Database,
  Fingerprint,
  LayoutDashboard,
  LogOut,
  Menu,
  PackageSearch,
  PanelLeftClose,
  Search,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Store,
  Tag,
  UserRound,
  X,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

ChartJS.register(ArcElement, BarElement, CategoryScale, Filler, Legend, LinearScale, LineElement, PointElement, Tooltip)

type Risk = 'Low' | 'Medium' | 'High' | 'Critical'


type Transaction = {
  id: string
  customer: string
  amount: string
  method: string
  score: number
  risk: Risk
  time: string
  initials: string
}



type FraudPrediction = {
  is_fraud: boolean
  risk_score: number
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH'
  risk_factors: string[]
  feature_explanations: {
    feature: string
    impact: number
    direction: 'increases' | 'decreases' | 'neutral'
  }[]
  message: string
  disclaimer: string
}


type DatabaseTransaction = {
  id: number
  transaction_reference: string
  amount: number | string
  risk_score: number | string
  risk_level: string
  status: string
  created_at: string
}


const transactions: Transaction[] = [
  { id: 'TXN-90241', customer: 'Maya Chen', amount: '$1,248.00', method: 'Visa •••• 4821', score: 94, risk: 'Critical', time: '2 min ago', initials: 'MC' },
  { id: 'TXN-90238', customer: 'Jon Bell', amount: '$384.50', method: 'Apple Pay', score: 68, risk: 'High', time: '11 min ago', initials: 'JB' },
  { id: 'TXN-90235', customer: 'Sofia Martin', amount: '$129.00', method: 'Visa •••• 9012', score: 31, risk: 'Medium', time: '18 min ago', initials: 'SM' },
  { id: 'TXN-90231', customer: 'Eli Warren', amount: '$78.00', method: 'Mastercard •••• 1180', score: 8, risk: 'Low', time: '24 min ago', initials: 'EW' },
  { id: 'TXN-90226', customer: 'Nora Okafor', amount: '$2,450.00', method: 'Amex •••• 7704', score: 82, risk: 'High', time: '36 min ago', initials: 'NO' },
]

const navItems = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Transactions', icon: CreditCard, count: '24' },
  { label: 'Fraud detective', icon: Fingerprint },
  { label: 'Inventory', icon: Boxes, count: '7' },
  { label: 'Incident center', icon: Bell, count: '3' },
]

const riskStyles: Record<Risk, string> = {
  Low: 'bg-[#e6f7ef] text-[#138a5b] ring-[#b7e8d0]',
  Medium: 'bg-[#fff5dd] text-[#a36b00] ring-[#f1d898]',
  High: 'bg-[#ffede7] text-[#c45135] ring-[#f2b8a8]',
  Critical: 'bg-[#ffe8eb] text-[#ba3048] ring-[#f3a6b4]',
}

function StatCard({ label, value, change, positive, icon: Icon, accent }: { label: string; value: string; change: string; positive?: boolean; icon: typeof ShieldCheck; accent: string }) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div className={`icon-tile ${accent}`}><Icon /></div>
        <span className={`trend ${positive ? 'positive' : 'negative'}`}>{positive ? <ArrowUpRight /> : <ArrowDownRight />}{change}</span>
      </div>
      <div className="mt-5"><p className="eyebrow">{label}</p><p className="stat-value">{value}</p></div>
      <p className="stat-foot">vs. previous 30 days</p>
    </div>
  )
}

function RiskBadge({ risk }: { risk: Risk }) { return <span className={`risk-badge ${riskStyles[risk]}`}><span className="risk-dot" />{risk}</span> }

type Product = { sku: string; name: string; category: string; stock: number; threshold: number; price: number }

type Incident = {
  id: string
  title: string
  category: string
  related: string
  severity: Risk
  status: 'Open' | 'Investigating' | 'Resolved'
  time: string
  notes?: string
}


const demoProducts: Product[] = [
  { sku: 'SKU-AU-104', name: 'Wireless headphones', category: 'Electronics', stock: 8, threshold: 15, price: 129 },
  { sku: 'SKU-HM-208', name: 'Ceramic pour-over set', category: 'Home', stock: 42, threshold: 20, price: 68 },
  { sku: 'SKU-AP-331', name: 'Linen overshirt', category: 'Apparel', stock: 0, threshold: 12, price: 94 },
  { sku: 'SKU-WL-087', name: 'Daily hydration kit', category: 'Wellness', stock: 17, threshold: 18, price: 44 },
  { sku: 'SKU-EL-412', name: 'USB-C travel hub', category: 'Electronics', stock: 63, threshold: 18, price: 79 },
]
const demoIncidents: Incident[] = [
  { id: 'INC-1042', title: 'High-risk transaction detected', category: 'Fraud', related: 'TXN-90241', severity: 'Critical', status: 'Open', time: '2 min ago' },
  { id: 'INC-1041', title: 'Inventory threshold reached', category: 'Inventory', related: 'SKU-AU-104', severity: 'High', status: 'Investigating', time: '38 min ago' },
  { id: 'INC-1039', title: 'Velocity anomaly detected', category: 'Fraud', related: 'TXN-90238', severity: 'High', status: 'Open', time: '1 hr ago' },
  { id: 'INC-1032', title: 'Product is out of stock', category: 'Inventory', related: 'SKU-AP-331', severity: 'Medium', status: 'Resolved', time: '3 hrs ago' },
]

function PageHeading({ overline, title, description, children }: { overline: string; title: string; description: string; children?: React.ReactNode }) {
  return <div className="welcome-row"><div><p className="overline">{overline}</p><h1>{title}</h1><p className="subtitle">{description}</p></div>{children && <div className="header-actions">{children}</div>}</div>
}
function DetailPanel({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return <div className="modal-backdrop" onClick={onClose}><section className="playground-modal" onClick={(e) => e.stopPropagation()}><div className="modal-top"><div><p className="overline">DETAIL VIEW</p><h2>{title}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close detail panel"><X /></button></div>{children}</section></div>
}

function TransactionsPage() {
  const [search, setSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState('All')
  const [sortBy, setSortBy] = useState('newest')
  const [transactions, setTransactions] = useState<DatabaseTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [selected, setSelected] = useState<DatabaseTransaction | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadTransactions() {
      try {
        setLoading(true)
        setError('')

        const response = await fetch(
          'http://localhost:7070/api/transactions'
        )

        if (!response.ok) {
          throw new Error(`Request failed: ${response.status}`)
        }

        const data: DatabaseTransaction[] = await response.json()

        if (!cancelled) {
          setTransactions(data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Could not load transactions.'
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadTransactions()

    return () => {
      cancelled = true
    }
  }, [])

  
const rows = transactions
  .filter((tx) => {
    const matchesSearch =
      `${tx.transaction_reference} ${tx.status} ${tx.risk_level}`
        .toLowerCase()
        .includes(search.toLowerCase())

    const matchesRisk =
      riskFilter === 'All' ||
      tx.risk_level.toUpperCase() === riskFilter.toUpperCase()

    return matchesSearch && matchesRisk
  })
  .sort((a, b) => {
    switch (sortBy) {
      case 'oldest':
        return (
          new Date(a.created_at).getTime() -
          new Date(b.created_at).getTime()
        )
      case 'amount':
        return Number(b.amount) - Number(a.amount)
      case 'risk':
        return Number(b.risk_score) - Number(a.risk_score)
      case 'newest':
      default:
        return (
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
        )
    }
  })


  const totalFlagged = transactions.filter(
    (tx) => tx.status === 'FLAGGED'
  ).length

  const blockedValue = transactions
    .filter((tx) => tx.status === 'FLAGGED')
    .reduce((sum, tx) => sum + Number(tx.amount), 0)

  const formatAmount = (amount: number | string) =>
    `₹${Number(amount).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`

  const getRisk = (level: string): Risk => {
    const normalized = level.toUpperCase()

    if (normalized === 'HIGH') return 'High'
    if (normalized === 'MEDIUM') return 'Medium'
    if (normalized === 'CRITICAL') return 'Critical'
    return 'Low'
  }

  return (
    <div className="route-stack">
      <PageHeading
        overline="SECURITY OPERATIONS"
        title="Transactions"
        description="Monitor screened transactions saved in PostgreSQL."
      >
        <span className="demo-pill">LIVE DATABASE</span>
      </PageHeading>

      <div className="kpi-grid">
        <StatCard
          label="Saved transactions"
          value={String(transactions.length)}
          change="Database records"
          positive
          icon={CreditCard}
          accent="blue"
        />
        <StatCard
          label="Flagdefault function Pageged transactions"
          value={String(totalFlagged)}
          change="Requires review"
          icon={Fingerprint}
          accent="amber"
        />
        <StatCard
          label="Flagged transaction value"
          value={formatAmount(blockedValue)}
          change="Flagged records"
          icon={ShieldCheck}
          accent="green"
        />
      </div>

      {loading && (
        <div className="analysis-result" role="status">
          Loading transactions from PostgreSQL...
        </div>
      )}

      {error && (
        <div className="analysis-result" role="alert">
          <strong>Could not load transactions</strong>
          <p>{error}</p>
          <button
            className="secondary-button"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      )}

      <section className="panel transactions-panel">
        <div className="table-toolbar">
          <div className="search-field">
            <Search />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reference, status, or risk..."
            />
          </div>

          <select
            className="compact-select"
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            aria-label="Filter by risk"
          >
            <option value="All">All risks</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
          
          <select
            className="compact-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort transactions"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="amount">Highest amount</option>
            <option value="risk">Highest risk score</option>
          </select>

        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Transaction reference</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Fraud probability</th>
                <th>Risk level</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((tx) => (
                <tr
                  key={tx.id}
                  className="clickable-row"
                  onClick={() => setSelected(tx)}
                >
                  <td>
                    <strong>{tx.transaction_reference}</strong>
                    <small className="table-subtext">
                      Database ID: {tx.id}
                    </small>
                  </td>
                  <td>
                    <strong>{formatAmount(tx.amount)}</strong>
                  </td>
                  <td className="muted-cell">
                    {new Date(tx.created_at).toLocaleString('en-IN')}
                  </td>
                  <td>
                    <div className="score">
                      <span className={`score-bar ${getRisk(tx.risk_level).toLowerCase()}`}>
                        <i
                          style={{
                            width: `${Math.min(100, Math.max(0, Number(tx.risk_score)))}%`,
                          }}
                        />
                      </span>
                      <b>{Number(tx.risk_score)}%</b>
                    </div>
                  </td>
                  <td>
                    <RiskBadge risk={getRisk(tx.risk_level)} />
                  </td>
                  <td>
                    <span className="status-chip">{tx.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!loading && !error && rows.length === 0 && (
            <div className="empty-state">
              <Search />
              <strong>No transactions found</strong>
              <p>
                {transactions.length === 0
                  ? 'Analyze a transaction in Fraud Playground to save your first record.'
                  : 'Try a different search or risk filter.'}
              </p>
            </div>
          )}
        </div>

        <div className="pagination">
          <span>
            Showing {rows.length} of {transactions.length} saved transactions
          </span>
        </div>
      </section>

      {selected && (
        <DetailPanel
          title={selected.transaction_reference}
          onClose={() => setSelected(null)}
        >
          <div className="detail-grid">
            <div>
              <span className="eyebrow">AMOUNT</span>
              <strong>{formatAmount(selected.amount)}</strong>
            </div>
            <div>
              <span className="eyebrow">RISK LEVEL</span>
              <RiskBadge risk={getRisk(selected.risk_level)} />
            </div>
            <div>
              <span className="eyebrow">STATUS</span>
              <strong>{selected.status}</strong>
            </div>
            <div>
              <span className="eyebrow">CREATED</span>
              <strong>
                {new Date(selected.created_at).toLocaleString('en-IN')}
              </strong>
            </div>
          </div>

          <div className="analysis-result">
            <div className="result-score">
              <strong>{Number(selected.risk_score)}%</strong>
              <span>Model risk score</span>
            </div>
            <p>
              This prediction was retrieved from your PostgreSQL database.
            </p>
          </div>

          <div className="modal-actions">
            <button
              className="primary-button"
              onClick={() => setSelected(null)}
            >
              Close details
            </button>
          </div>
        </DetailPanel>
      )}
    </div>
  )
}

function FraudPage() {  
  type PredictionResult = {
    is_fraud: boolean
    risk_score: number
    risk_level: string
    risk_factors: string[]
    feature_explanations: {
      feature: string
      impact: number
      direction: 'increases' | 'decreases' | 'neutral'
    }[]
    message: string
    disclaimer?: string
    saved_transaction?: {
      id: number
      transaction_reference: string
      created_at: string
    } | null
  }


  const [amount, setAmount] = useState('2480')
  const [velocity, setVelocity] = useState('7')
  const [accountAge, setAccountAge] = useState('30')
  const [foreign, setForeign] = useState(false)
  const [result, setResult] = useState<PredictionResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [transactions, setTransactions] = useState<DatabaseTransaction[]>([])
  const [loadingTransactions, setLoadingTransactions] = useState(true)
  const [selected, setSelected] = useState<DatabaseTransaction | null>(null)

  const loadTransactions = async () => {
    try {
      const response = await fetch('http://localhost:7070/api/transactions')

      if (!response.ok) {
        throw new Error(`Could not load transactions: ${response.status}`)
      }

      const data: DatabaseTransaction[] = await response.json()
      setTransactions(data)
    } catch (err) {
      console.error('Transaction loading failed:', err)
    } finally {
      setLoadingTransactions(false)
    }
  }

  useEffect(() => {
    void loadTransactions()
  }, [])

  const getRisk = (level: string): Risk => {
    const normalized = level.toUpperCase()

    if (normalized === 'CRITICAL') return 'Critical'
    if (normalized === 'HIGH') return 'High'
    if (normalized === 'MEDIUM') return 'Medium'
    return 'Low'
  }

  const formatAmount = (value: number | string) =>
    `₹${Number(value).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`

  const analyzeTransaction = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault()
    setError('')
    setResult(null)

    const transactionAmount = Number(amount)
    const transactionVelocity = Number(velocity)
    const age = Number(accountAge)

    if (
      !amount.trim() ||
      !velocity.trim() ||
      !accountAge.trim() ||
      !Number.isFinite(transactionAmount) ||
      !Number.isInteger(transactionVelocity) ||
      !Number.isInteger(age) ||
      transactionAmount <= 0 ||
      transactionVelocity < 0 ||
      age < 0
    ) {
      setError(
        'Enter a positive transaction amount and valid non-negative whole numbers for transaction count and account age.'
      )
      return
    }

    setLoading(true)

    try {
      const response = await fetch(
        'http://localhost:8000/api/fraud/predict',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: transactionAmount,
            transactions_last_hour: transactionVelocity,
            account_age_days: age,
            is_foreign_transaction: foreign,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail || data.message || `Prediction failed: ${response.status}`
        )
      }

      setResult(data)
      await loadTransactions()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not connect to the Python fraud detection API.'
      )
    } finally {
      setLoading(false)
    }
  }

  const flaggedCount = transactions.filter(
    (tx) => tx.status.toUpperCase() === 'FLAGGED'
  ).length

  const highRiskCount = transactions.filter((tx) =>
    ['HIGH', 'CRITICAL'].includes(tx.risk_level.toUpperCase())
  ).length

  return (
    <div className="route-stack">
      <PageHeading
        overline="AI-POWERED SECURITY"
        title="Fraud Detection"
        description="Analyze transaction risk using your Python machine learning API and review saved predictions."
      >
        <span className="demo-pill">PYTHON API</span>
      </PageHeading>

      <div className="kpi-grid">
        <StatCard
          label="Saved transactions"
          value={String(transactions.length)}
          change="PostgreSQL records"
          positive
          icon={CreditCard}
          accent="blue"
        />
        <StatCard
          label="Flagged transactions"
          value={String(flaggedCount)}
          change="Saved as flagged"
          icon={ShieldCheck}
          accent="amber"
        />
        <StatCard
          label="High-risk records"
          value={String(highRiskCount)}
          change="High or critical risk"
          icon={Fingerprint}
          accent="red"
        />
      </div>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>AI Fraud Analysis</h2>
            <p>Enter transaction details to request a prediction.</p>
          </div>
          <Sparkles />
        </div>

        <form onSubmit={analyzeTransaction} className="playground-fields">
          <label>
            Transaction amount (₹)
            <input
              type="number"
              min="0.01"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 2480"
            />
          </label>

          <label>
            Transactions in the last hour
            <input
              type="number"
              min="0"
              step="1"
              required
              value={velocity}
              onChange={(e) => setVelocity(e.target.value)}
              placeholder="e.g. 7"
            />
          </label>

          <label>
            Account age (days)
            <input
              type="number"
              min="0"
              step="1"
              required
              value={accountAge}
              onChange={(e) => setAccountAge(e.target.value)}
              placeholder="e.g. 30"
            />
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={foreign}
              onChange={(e) => setForeign(e.target.checked)}
            />
            Foreign transaction
          </label>

          <button className="primary-button" type="submit" disabled={loading}>
            <Sparkles />
            {loading ? 'Analyzing...' : 'Analyze transaction'}
          </button>
        </form>

        {error && (
          <div className="analysis-result" role="alert">
            <strong>Analysis failed</strong>
            <p>{error}</p>
            <p>Check that the Python API is running on port 8000.</p>
          </div>
        )}

        {result && (
          <div className="analysis-result">
            <div className="result-score">
              <strong>{result.risk_score}%</strong>
              <span>AI model risk score</span>
            </div>

            <RiskBadge risk={getRisk(result.risk_level)} />

            <h3>
              {result.is_fraud
                ? 'Suspicious transaction detected'
                : 'Transaction classified as low risk'}
            </h3>

            <p>{result.message}</p>
            
            <div className="risk-factors">
              <strong>Risk Factors Detected</strong>
              {result.risk_factors?.length > 0 ? (
                <ul>
                  {result.risk_factors.map((factor) => (
                    <li key={factor}>{factor}</li>
                  ))}
                </ul>
              ) : (
                <p>No predefined risk indicators detected.</p>
              )}
            </div>

            <div className="shap-explanations">
              <strong>AI Feature Explanations (SHAP)</strong>
              <p className="shap-description">
                How each input influenced the model's fraud prediction.
              </p>

              {result.feature_explanations?.map((item) => (
                <div className="shap-feature" key={item.feature}>
                  <div className="shap-feature-header">                    
                    <div className="shap-feature-name">
                      <span>
                        {{
                          amount: 'Transaction Amount',
                          transactions_last_hour: 'Transaction Frequency',
                          account_age_days: 'Account Age',
                          is_foreign_transaction: 'Foreign Transaction',
                        }[item.feature] ?? item.feature.replaceAll('_', ' ')}
                      </span>

                      <small>
                        {{
                          amount: 'Value of the purchase being evaluated.',
                          transactions_last_hour: 'Number of transactions in the past hour.',
                          account_age_days: 'How long the customer account has existed.',
                          is_foreign_transaction: 'Whether the transaction is marked as foreign.',
                        }[item.feature] ?? 'Input feature used by the fraud model.'}
                      </small>
                    </div>

                    <span className={`shap-direction ${item.direction}`}>
                      {item.direction}
                    </span>
                  </div>                  
                  <div className="shap-impact">
                    <div className="shap-impact-label">
                      <span>Model contribution</span>
                      <strong>
                        {item.impact > 0 ? '+' : ''}
                        {item.impact.toFixed(4)}
                      </strong>
                    </div>

                    <div
                      className="shap-impact-track"
                      role="img"
                      aria-label={`${item.feature}: ${item.direction} fraud model output by ${Math.abs(item.impact).toFixed(4)}`}
                    >
                      <div
                        className={`shap-impact-bar ${item.direction}`}
                        style={{
                          width: `${Math.max(
                            3,
                            Math.min(100, Math.abs(item.impact) / 0.3 * 100)
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                </div>
              ))}
            </div>


            {result.saved_transaction && (
              <p>
                Saved reference:{' '}
                <strong>
                  {result.saved_transaction.transaction_reference}
                </strong>
              </p>
            )}

            {result.disclaimer && (
              <p className="demo-note">{result.disclaimer}</p>
            )}
          </div>
        )}
      </section>

      <section className="panel transactions-panel">
        <div className="panel-heading">
          <div>
            <h2>Recent transaction records</h2>
            <p>Transactions retrieved from your PostgreSQL database.</p>
          </div>
          <button
            className="secondary-button"
            type="button"
            onClick={() => void loadTransactions()}
          >
            Refresh
          </button>
        </div>

        {loadingTransactions ? (
          <div className="analysis-result" role="status">
            Loading saved transactions...
          </div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Amount</th>
                  <th>Risk score</th>
                  <th>Risk level</th>
                  <th>Status</th>
                  <th>Details</th>
                </tr>
              </thead>

              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>
                      <strong>{tx.transaction_reference}</strong>
                    </td>
                    <td>{formatAmount(tx.amount)}</td>
                    <td>{Number(tx.risk_score)}%</td>
                    <td>
                      <RiskBadge risk={getRisk(tx.risk_level)} />
                    </td>
                    <td>
                      <span className="status-chip">{tx.status}</span>
                    </td>
                    <td>
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() => setSelected(tx)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {transactions.length === 0 && (
              <div className="empty-state">
                <strong>No saved transactions yet</strong>
                <p>Analyze a transaction above to create your first record.</p>
              </div>
            )}
          </div>
        )}
      </section>

      {selected && (
        <DetailPanel
          title={selected.transaction_reference}
          onClose={() => setSelected(null)}
        >
          <div className="detail-grid">
            <div>
              <span className="eyebrow">AMOUNT</span>
              <strong>{formatAmount(selected.amount)}</strong>
            </div>
            <div>
              <span className="eyebrow">RISK SCORE</span>
              <strong>{Number(selected.risk_score)}%</strong>
            </div>
            <div>
              <span className="eyebrow">RISK LEVEL</span>
              <RiskBadge risk={getRisk(selected.risk_level)} />
            </div>
            <div>
              <span className="eyebrow">STATUS</span>
              <strong>{selected.status}</strong>
            </div>
            <div>
              <span className="eyebrow">CREATED</span>
              <strong>
                {new Date(selected.created_at).toLocaleString('en-IN')}
              </strong>
            </div>
          </div>
        </DetailPanel>
      )}
    </div>
  )
}

function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState('');
  const [query, setQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [status, setStatus] = useState('All');
  const [editing, setEditing] = useState<Product | null>(null);
  const [adding, setAdding] = useState(false);
  const [adjusting, setAdjusting] = useState<Product | null>(null);

  const API_URL = 'http://localhost:7070/api/products';

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        setLoadingProducts(true);
        setProductsError('');

        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();

        const mappedProducts: Product[] = data.map(
          (item: {
            id: number;
            name: string;
            category: string | null;
            price: number | string;
            stock_quantity: number;
            reorder_level: number;
          }) => ({
            sku: `SKU-${String(item.id).padStart(3, '0')}`,
            name: item.name,
            category: item.category ?? 'Uncategorized',
            stock: item.stock_quantity,
            threshold: item.reorder_level,
            price: Number(item.price),
          })
        );

        if (!cancelled) {
          setProducts(mappedProducts);
        }
      } catch (error) {
        if (!cancelled) {
          setProductsError(
            error instanceof Error
              ? error.message
              : 'Unable to load inventory.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingProducts(false);
        }
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = products.filter(
    (p) =>
      `${p.sku} ${p.name} ${p.category}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (status === 'All' ||
        (status === 'Out of stock'
          ? p.stock === 0
          : status === 'Low stock'
            ? p.stock > 0 && p.stock <= p.threshold
            : p.stock > p.threshold))
  );

  
  const saveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const data = new FormData(form);

    const payload = {
      name: String(data.get('name') ?? '').trim(),
      category: String(data.get('category') ?? '').trim(),
      price: Number(data.get('price')),
      stock_quantity: Number(data.get('stock')),
      reorder_level: Number(data.get('threshold')),
    };

    if (
      !payload.name ||
      !payload.category ||
      !Number.isFinite(payload.price) ||
      !Number.isInteger(payload.stock_quantity) ||
      !Number.isInteger(payload.reorder_level) ||
      payload.price < 0 ||
      payload.stock_quantity < 0 ||
      payload.reorder_level < 0
    ) {
      alert('Please enter valid product details.');
      return;
    }

    try {
      const isEditing = editing !== null;
      const productId = isEditing && editing
        ? Number(editing.sku.replace('SKU-', ''))
        : null;

      const response = await fetch(
        isEditing
          ? `${API_URL}/${productId}`
          : API_URL,
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || 'Unable to save the product.'
        );
      }

      const savedProduct: Product = {
        sku: `SKU-${String(result.id).padStart(3, '0')}`,
        name: result.name,
        category: result.category ?? 'Uncategorized',
        stock: result.stock_quantity,
        threshold: result.reorder_level,
        price: Number(result.price),
      };

      if (isEditing) {
        setProducts((current) =>
          current.map((product) =>
            product.sku === savedProduct.sku
              ? savedProduct
              : product
          )
        );
      } else {
        setProducts((current) => [savedProduct, ...current]);
      }

      setProductsError('');
      setAdding(false);
      setEditing(null);

      alert(
        isEditing
          ? 'Product updated successfully in PostgreSQL!'
          : 'Product saved successfully to PostgreSQL!'
      );
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'Unable to save the product. Please try again.'
      );
    }
  };


  return (
    <div className="route-stack">
      <PageHeading
        overline="COMMERCE OPERATIONS"
        title="Inventory"
        description="Track stock health, reorder thresholds, and movement across your catalog."
      >
        <button
          className="primary-button"
          onClick={() => setAdding(true)}
        >
          <PackageSearch /> Add product
        </button>
      </PageHeading>

      <div className="kpi-grid">
        <StatCard
          label="Total products"
          value={String(products.length)}
          change="4.2%"
          positive
          icon={Boxes}
          accent="blue"
        />
        <StatCard
          label="Stock value"
          value={`₹${products
            .reduce((sum, p) => sum + p.stock * p.price, 0)
            .toLocaleString('en-IN')}`}
          change="6.8%"
          positive
          icon={ShoppingBag}
          accent="green"
        />
        <StatCard
          label="Low-stock items"
          value={String(
            products.filter(
              (p) => p.stock > 0 && p.stock <= p.threshold
            ).length
          )}
          change="2.4%"
          icon={AlertTriangle}
          accent="amber"
        />
        <StatCard
          label="Out of stock"
          value={String(
            products.filter((p) => p.stock === 0).length
          )}
          change="1.1%"
          icon={PackageSearch}
          accent="red"
        />
      </div>

      {loadingProducts && (
        <div className="analysis-result" role="status">
          Loading inventory from PostgreSQL...
        </div>
      )}

      {productsError && (
        <div className="analysis-result" role="alert">
          Could not load inventory: {productsError}
          <button
            className="secondary-button"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      )}

      <section className="panel transactions-panel">
        <div className="table-toolbar">
          <div className="search-field">
            <Search />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search SKU, product, or category..."
            />
          </div>

          <select
            className="compact-select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Filter stock status"
          >
            <option>All</option>
            <option>Healthy</option>
            <option>Low stock</option>
            <option>Out of stock</option>
          </select>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product</th>
                <th>Category</th>
                <th>Current stock</th>
                <th>Reorder threshold</th>
                <th>Unit price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((p) => {
                const stockRisk: Risk =
                  p.stock === 0
                    ? 'Critical'
                    : p.stock <= p.threshold
                      ? 'High'
                      : 'Low';

                return (
                  <tr key={p.sku}>
                    <td>
                      <strong>{p.sku}</strong>
                    </td>
                    <td>{p.name}</td>
                    <td className="muted-cell">{p.category}</td>
                    <td>
                      <strong>{p.stock}</strong> units
                    </td>
                    <td className="muted-cell">
                      {p.threshold}
                    </td>
                    <td>₹{p.price.toLocaleString('en-IN')}</td>
                    <td>
                      <RiskBadge risk={stockRisk} />
                    </td>
                    <td>                      
                      
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-lg bg-teal-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                          onClick={() => setAdjusting(p)}
                        >
                          Adjust Stock
                        </button>

                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                          onClick={() => setEditing(p)}
                        >
                          Edit Product
                        </button>
                      </div>


                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {!loadingProducts && filtered.length === 0 && (
            <div className="empty-state">
              <Search />
              <strong>No products found</strong>
              <p>Try another search or add a product.</p>
            </div>
          )}
        </div>
      </section>

      <section className="dashboard-grid two-col">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Low-stock alerts</h2>
              <p>Reorder recommendations</p>
            </div>
          </div>

          {products.filter((p) => p.stock <= p.threshold).map((p) => (
            <div className="alert-item warning" key={p.sku}>
              <PackageSearch />
              <div>
                <strong>{p.name}</strong>
                <p>
                  Reorder{' '}
                  {Math.max(p.threshold * 2 - p.stock, p.threshold)}{' '}
                  units to restore buffer.
                </p>
              </div>
            </div>
          ))}

          {products.filter((p) => p.stock <= p.threshold).length ===
            0 && <p className="demo-note">All products have healthy stock.</p>}
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Demand trend</h2>
              <p>Illustrative 30-day units sold</p>
            </div>
          </div>

          <div className="chart-wrap line-chart">
            <Line
              data={{
                labels: ['W1', 'W2', 'W3', 'W4'],
                datasets: [
                  {
                    label: 'Units',
                    data: [120, 168, 142, 196],
                    borderColor: '#12b8a6',
                    backgroundColor: 'rgba(18,184,166,.11)',
                    fill: true,
                    tension: 0.4,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                },
              }}
            />
          </div>
        </section>
      </section>

      {(adding || editing) && (
        <DetailPanel
          title={adding ? 'Add product' : 'Edit product'}
          onClose={() => {
            setAdding(false);
            setEditing(null);
          }}
        >
          <form onSubmit={saveProduct} className="playground-fields">
            <label>
              SKU
              <input
                value={
                  editing?.sku ?? 'Generated automatically'
                }
                readOnly
              />
            </label>

            <label>
              Product name
              <input
                name="name"
                required
                defaultValue={editing?.name ?? ''}
              />
            </label>

            <label>
              Category
              <input
                name="category"
                required
                defaultValue={editing?.category ?? ''}
              />
            </label>

            <label>
              Current stock
              <input
                name="stock"
                type="number"
                min="0"
                step="1"
                required
                defaultValue={editing?.stock ?? 0}
              />
            </label>

            <label>
              Reorder threshold
              <input
                name="threshold"
                type="number"
                min="0"
                step="1"
                required
                defaultValue={editing?.threshold ?? 10}
              />
            </label>

            <label>
              Unit price (₹)
              <input
                name="price"
                type="number"
                min="0"
                step="0.01"
                required
                defaultValue={editing?.price ?? 0}
              />
            </label>

            <button className="primary-button" type="submit">
              {adding ? 'Save product' : 'Update product'}
            </button>
          </form>
        </DetailPanel>
      )}

      {adjusting && (
        <DetailPanel
          title={`Adjust ${adjusting.sku}`}
          onClose={() => setAdjusting(null)}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();

              const formData = new FormData(e.currentTarget);
              const amount = Number(formData.get('amount'));
              const productId = Number(
                adjusting.sku.replace('SKU-', '')
              );

              if (!Number.isInteger(amount) || amount === 0) {
                alert('Enter a non-zero whole number.');
                return;
              }

              try {
                const response = await fetch(
                  `http://localhost:7070/api/products/${productId}/stock`,
                  {
                    method: 'PATCH',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ amount }),
                  }
                );

                const data = await response.json();

                if (!response.ok) {
                  throw new Error(data.error || 'Stock adjustment failed.');
                }

                alert(`Stock updated successfully! New stock: ${data.stock_quantity}`);
                setAdjusting(null);
                window.location.reload();
              } catch (error) {
                alert(
                  error instanceof Error
                    ? error.message
                    : 'Could not connect to the backend.'
                );
              }
            }}
            className="playground-fields"
          >
            <label>
              Adjustment units
              <input
                name="amount"
                type="number"
                required
                placeholder="e.g. 12 or -4"
              />
            </label>

            <button className="primary-button" type="submit">
              Apply adjustment
            </button>
          </form>
        </DetailPanel>
      )}
    </div>
  );
}


function IncidentsPage() {
  const [items, setItems] = useState<Incident[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All statuses');
  const [selected, setSelected] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

    const updateIncidentStatus = async (
    incident: Incident,
    newStatus: Incident['status']
  ) => {
    try {
      const response = await fetch(
        `http://localhost:7070/api/incidents/${encodeURIComponent(incident.id)}/status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Could not update incident status');
      }

      const updatedIncident = { ...incident, status: newStatus };

      setItems((current) =>
        current.map((item) =>
          item.id === incident.id ? updatedIncident : item
        )
      );

      setSelected(updatedIncident);
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : 'Could not update incident status'
      );
    }
  };
  
  const saveIncidentNotes = async (
    incident: Incident,
    noteText: string
  ) => {
    try {
      setSavingNotes(true);

      const response = await fetch(
        `http://localhost:7070/api/incidents/${encodeURIComponent(incident.id)}/notes`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes: noteText }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || 'Could not save incident notes'
        );
      }

      const updatedIncident = {
        ...incident,
        notes: data.notes ?? noteText,
      };

      setItems((current) =>
        current.map((item) =>
          item.id === incident.id ? updatedIncident : item
        )
      );

      setSelected(updatedIncident);
      setNotes(updatedIncident.notes ?? '');

      alert('Incident notes saved to PostgreSQL.');
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : 'Could not save incident notes'
      );
    } finally {
      setSavingNotes(false);
    }
  };


  useEffect(() => {
    let cancelled = false;

    async function loadIncidents() {
      try {
        const response = await fetch('http://localhost:7070/api/incidents');

        if (!response.ok) {
          throw new Error(`Request failed: ${response.status}`);
        }

        const data = await response.json();

        const mapped: Incident[] = data.map((item: {
          id: number;
          incident_reference: string;
          title: string;
          category: string;
          related_reference: string | null;
          severity: string;
          status: string;
          notes: string | null;
          created_at: string;
        }) => ({
          id: item.incident_reference,
          title: item.title,
          category: item.category,
          related: item.related_reference ?? '—',
          severity: (
            item.severity.charAt(0).toUpperCase() +
            item.severity.slice(1).toLowerCase()
          ) as Risk,
          status: item.status as Incident['status'],
          time: new Date(item.created_at).toLocaleString(),
          notes: item.notes ?? '',
        }));

        if (!cancelled) {
          setItems(mapped);
          setError('');
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Could not load incidents.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadIncidents();

    return () => {
      cancelled = true;
    };
  }, []);

  const visible = items.filter(
    (i) =>
      `${i.id} ${i.title} ${i.related}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (status === 'All statuses' || i.status === status)
  );

  return (
    <div className="route-stack">
      <PageHeading
        overline="SECURITY OPERATIONS"
        title="Incident Center"
        description="Review, investigate, and resolve fraud and inventory alerts."
      >
        <span className="demo-pill">● PostgreSQL Connected</span>
      </PageHeading>

      <div className="kpi-grid">
        <StatCard
          label="Open Incidents"
          value={String(items.filter((i) => i.status === 'Open').length)}
          change="Awaiting review"
          icon={Bell}
          accent="amber"
        />
        <StatCard
          label="Investigating"
          value={String(items.filter((i) => i.status === 'Investigating').length)}
          change="Under review"
          icon={Fingerprint}
          accent="blue"
        />
        <StatCard
          label="Resolved"
          value={String(items.filter((i) => i.status === 'Resolved').length)}
          change="Completed"
          positive
          icon={ShieldCheck}
          accent="green"
        />
      </div>

      {loading && (
        <div className="analysis-result" role="status">
          Loading incidents from PostgreSQL...
        </div>
      )}

      {error && (
        <div className="analysis-result" role="alert">
          <strong>Could not load incidents</strong>
          <p>{error}</p>
          <button
            className="secondary-button"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      )}

      <section className="panel transactions-panel">
        <div className="table-toolbar">
          <div className="search-field">
            <Search />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search incidents..."
            />
          </div>

          <select
            className="compact-select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Filter incident status"
          >
            <option>All statuses</option>
            <option>Open</option>
            <option>Investigating</option>
            <option>Resolved</option>
          </select>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Incident</th>
                <th>Category</th>
                <th>Related Reference</th>
                <th>Severity</th>
                <th>Created</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {visible.map((incident) => (
                <tr
                  key={incident.id}
                  className="clickable-row"
                  onClick={() => setSelected(incident)}
                >
                  <td>
                    <strong>{incident.id}</strong>
                    <small className="table-subtext">
                      {incident.title}
                    </small>
                  </td>
                  <td>{incident.category}</td>
                  <td>{incident.related}</td>
                  <td><RiskBadge risk={incident.severity} /></td>
                  <td className="muted-cell">{incident.time}</td>
                  <td>
                    <span className="status-chip">{incident.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!loading && !error && visible.length === 0 && (
            <div className="empty-state">
              <Search />
              <strong>No incidents found</strong>
              <p>Try another search or status filter.</p>
            </div>
          )}
        </div>
      </section>

      {selected && (
        <DetailPanel
          title={selected.id}
          onClose={() => setSelected(null)}
        >
          <div className="incident-detail-content">
            <p className="eyebrow">INCIDENT SUMMARY</p>
            <h3 className="incident-detail-title">{selected.title}</h3>
            <p className="subtitle">
              Review the incident information and update its status below.
            </p>

            <div className="detail-grid">
              <div>
                <span className="eyebrow">CATEGORY</span>
                <strong>{selected.category}</strong>
              </div>
              <div>
                <span className="eyebrow">RELATED REFERENCE</span>
                <strong>{selected.related}</strong>
              </div>
              <div>
                <span className="eyebrow">SEVERITY</span>
                <RiskBadge risk={selected.severity} />
              </div>
              <div>
                <span className="eyebrow">CURRENT STATUS</span>
                <strong>{selected.status}</strong>
              </div>
            </div>
                        
            <div className="incident-notes">
              <label htmlFor="incident-notes">Investigation notes</label>

              <textarea
                id="incident-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Record findings, actions taken, and next steps..."
                rows={5}
              />

              <p className="demo-note">
                Save your investigation notes to PostgreSQL.
              </p>
                            
              <button
                type="button"
                className="primary-button"
                disabled={savingNotes}
                onClick={() => {
                  if (selected) {
                    void saveIncidentNotes(selected, notes);
                  }
                }}
              >
                {savingNotes ? 'Saving...' : 'Save Notes'}
              </button>

            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                disabled={selected.status === 'Investigating'}
                onClick={() =>
                  void updateIncidentStatus(selected, 'Investigating')
                }
              >
                Assign &amp; investigate
              </button>

              <button
                type="button"
                className="primary-button"
                disabled={selected.status === 'Resolved'}
                onClick={() =>
                  void updateIncidentStatus(selected, 'Resolved')
                }
              >
                Resolve incident
              </button>
            </div>
          </div>
        </DetailPanel>
      )}
    </div>
  )
 }

function RoutePage({ pathname, onSave }: { pathname: string; onSave: () => void }) {
  if (pathname === '/transactions') return <TransactionsPage />
  if (pathname === '/fraud-detective') return <FraudPage />
  if (pathname === '/inventory') return <InventoryPage />
  if (pathname === '/incidents') return <IncidentsPage />
  const title = pathname === '/settings' ? 'Settings' : 'Help center'
  if (pathname === '/settings') return <section className="panel" style={{ padding: 28 }}><p className="overline">SYSTEM PREFERENCES</p><h1>{title}</h1><p className="subtitle">Manage your profile, notifications, theme, and account preferences.</p><div className="playground-fields"><label>Display name<input defaultValue="Alex Rivera" /></label><label>Email notifications<select defaultValue="Important alerts"><option>Important alerts</option><option>All activity</option><option>None</option></select></label><label>Theme<select defaultValue="System"><option>System</option><option>Light</option><option>Dark</option></select></label></div><button className="primary-button" onClick={onSave}>Save preferences</button></section>
  return <section className="panel" style={{ padding: 28 }}><p className="overline">SUPPORT LIBRARY</p><h1>{title}</h1><p className="subtitle">Search guidance for your workspace and security operations.</p><div className="search-field" style={{ maxWidth: 520 }}><Search /><input placeholder="Search FAQs and guidance..." /></div><div className="alert-list" style={{ marginTop: 24 }}><div className="alert-item info"><div><strong>How do I investigate a high-risk transaction?</strong><p>Open Fraud detective to review risk signals, velocity, and device context.</p></div></div><div className="alert-item warning"><div><strong>What do inventory alerts mean?</strong><p>Inventory alerts identify products approaching a configured stock threshold.</p></div></div><div className="alert-item critical"><div><strong>Need more help?</strong><p>Use your organization&apos;s internal support channel; no contact details are configured here.</p></div></div></div></section>
}

export default function Page() {
  const pathname = usePathname()
  const router = useRouter()
  const activeNav = pathname === '/' ? 'Overview' : pathname.slice(1).split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
  const [liveTransactions, setLiveTransactions] = useState<DatabaseTransaction[]>([]);
  const [liveProducts, setLiveProducts] = useState<Product[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState('');    
  const loadDashboardData = async () => {
    try {
      setDashboardLoading(true);
      setDashboardError('');

      const [transactionsResponse, productsResponse] = await Promise.all([
        fetch('http://localhost:7070/api/transactions'),
        fetch('http://localhost:7070/api/products'),
      ]);

      if (!transactionsResponse.ok || !productsResponse.ok) {
        throw new Error('Could not load dashboard data.');
      }

      const transactionsData: DatabaseTransaction[] =
        await transactionsResponse.json();

      const productsData = await productsResponse.json();

      setLiveTransactions(transactionsData);

      setLiveProducts(
        productsData.map((item: {
          id: number;
          name: string;
          category: string | null;
          price: number | string;
          stock_quantity: number;
          reorder_level: number;
        }) => ({
          sku: `SKU-${String(item.id).padStart(3, '0')}`,
          name: item.name,
          category: item.category ?? 'Uncategorized',
          stock: item.stock_quantity,
          threshold: item.reorder_level,
          price: Number(item.price),
        }))
      );
    } catch (error) {
      setDashboardError(
        error instanceof Error
          ? error.message
          : 'Failed to load dashboard data.'
      );
    } finally {
      setDashboardLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboardData();

    const intervalId = setInterval(() => {
      void loadDashboardData();
    }, 30000);

    return () => clearInterval(intervalId);
  }, []);


  const [range, setRange] = useState('30 days')
  const [searchOpen, setSearchOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [customizeOpen, setCustomizeOpen] = useState(false)
  const [workspaceOpen, setWorkspaceOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [saved, setSaved] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [playgroundOpen, setPlaygroundOpen] = useState(false)
  const [amount, setAmount] = useState('2480')
  const [velocity, setVelocity] = useState('7')
  const [analyzed, setAnalyzed] = useState(false)
  
const [fraudPrediction, setFraudPrediction] =
  useState<FraudPrediction | null>(null)
const [fraudLoading, setFraudLoading] = useState(false)
const [fraudError, setFraudError] = useState('')
const [accountAge, setAccountAge] = useState('2')
const [foreignTransaction, setForeignTransaction] = useState(true)

  const [query, setQuery] = useState('')
  const [riskFilter, setRiskFilter] = useState('ALL')
  const [sortBy, setSortBy] = useState('newest')

  const exportTransactions = () => {
    const headers = [
      'Transaction Reference',
      'Amount',
      'Risk Score',
      'Risk Level',
      'Status',
      'Created At',
    ];

    const rows = liveTransactions.map((tx) => [
      tx.transaction_reference,
      tx.amount,
      tx.risk_score,
      tx.risk_level,
      tx.status,
      tx.created_at,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\r\n');

    const blob = new Blob(['\uFEFF' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'nexus-guard-transactions.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };
    
  const filteredTransactions = useMemo(() => {
    const transactions = liveTransactions
      .filter((tx) => {
        const matchesSearch =
          `${tx.transaction_reference} ${tx.id} ${tx.status} ${tx.risk_level}`
            .toLowerCase()
            .includes(query.toLowerCase());

        const matchesRisk =
          riskFilter === 'ALL' ||
          tx.risk_level.toUpperCase() === riskFilter;

        return matchesSearch && matchesRisk;
      })
      .map((tx) => {
        const riskValue = tx.risk_level.toUpperCase();

        const risk: Risk =
          riskValue === 'CRITICAL' ? 'Critical' :
          riskValue === 'HIGH' ? 'High' :
          riskValue === 'MEDIUM' ? 'Medium' : 'Low';

        return {
          id: tx.transaction_reference,
          customer: 'Database transaction',
          amount: `₹${Number(tx.amount).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
          method: 'AI screened',
          score: Number(tx.risk_score),
          risk,
          time: new Date(tx.created_at).toLocaleString(),
          initials: 'DB',
          rawAmount: Number(tx.amount),
          rawTime: new Date(tx.created_at).getTime(),
        };
      });

    return transactions.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return a.rawTime - b.rawTime;
        case 'amount':
          return b.rawAmount - a.rawAmount;
        case 'risk':
          return b.score - a.score;
        case 'newest':
        default:
          return b.rawTime - a.rawTime;
      }
    });
  }, [liveTransactions, query, riskFilter, sortBy]);


  const priorityAlerts = useMemo(() => {
  const transactionAlerts = liveTransactions
    .filter((tx) =>
      ['HIGH', 'CRITICAL'].includes(tx.risk_level.toUpperCase())
    )
    .map((tx) => ({
      id: `transaction-${tx.id}`,
      type: 'transaction' as const,
      title: `${tx.risk_level} risk transaction detected`,
      description: `${tx.transaction_reference} · ₹${Number(tx.amount).toLocaleString('en-IN')}`,
      time: new Date(tx.created_at).toLocaleString(),
      level:
        tx.risk_level.toUpperCase() === 'CRITICAL'
          ? 'critical'
          : 'warning',
    }));

  const stockAlerts = liveProducts
    .filter((product) => product.stock <= product.threshold)
    .map((product) => ({
      id: `product-${product.sku}`,
      type: 'stock' as const,
      title:
        product.stock === 0
          ? 'Product out of stock'
          : 'Low stock warning',
      description: `${product.sku} · ${product.name} (${product.stock} left)`,
      time: 'Current stock status',
      level: product.stock === 0 ? 'critical' : 'warning',
    }));

  return [...transactionAlerts, ...stockAlerts].slice(0, 5);
}, [liveTransactions, liveProducts]);
  
  const riskDistribution = useMemo(() => {
    const total = liveTransactions.length;

    const counts = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(
      (level) =>
        liveTransactions.filter(
          (tx) => tx.risk_level.toUpperCase() === level
        ).length
    );

    const percentages =
      total === 0
        ? [0, 0, 0, 0]
        : counts.map((count) => (count / total) * 100);

    const roundedPercentages = percentages.map(Math.floor);

    let remaining =
      total === 0
        ? 0
        : 100 - roundedPercentages.reduce((sum, value) => sum + value, 0);

    const order = percentages
      .map((value, index) => ({
        index,
        remainder: value - Math.floor(value),
      }))
      .sort((a, b) => b.remainder - a.remainder);

    for (let i = 0; i < remaining; i++) {
      roundedPercentages[order[i].index]++;
    }

    return {
      total,
      counts,
      percentages: roundedPercentages,
    };
  }, [liveTransactions]);


  const riskScore = Math.min(99, Math.round(Number(amount) / 65 + Number(velocity) * 3.1))
  const risk: Risk = riskScore > 84 ? 'Critical' : riskScore > 58 ? 'High' : riskScore > 30 ? 'Medium' : 'Low'

  const analyzeFraud = async () => {
    setFraudLoading(true)
    setFraudError('')
    setFraudPrediction(null)
    setAnalyzed(false)

    try {
      const response = await fetch(
        'http://127.0.0.1:8000/api/fraud/predict',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: Number(amount),
            transactions_last_hour: Number(velocity),
            account_age_days: Number(accountAge),
            is_foreign_transaction: foreignTransaction,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail
            ? JSON.stringify(data.detail)
            : 'Fraud prediction request failed.'
        )
      }
            
      setFraudPrediction(data)
      setAnalyzed(true)

      // Save the analyzed transaction to PostgreSQL
      const transactionReference = `TXN-${Date.now()}`

      const riskLevel = String(data.risk_level).toUpperCase()
      const transactionStatus = data.is_fraud ? 'FLAGGED' : 'APPROVED'

      const transactionResponse = await fetch(
        'http://localhost:7070/api/transactions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            transaction_reference: transactionReference,
            amount: Number(amount),
            risk_score: Number(data.risk_score),
            risk_level: riskLevel,
            status: transactionStatus,
          }),
        }
      )

      const savedTransaction = await transactionResponse.json()

      if (!transactionResponse.ok) {
        throw new Error(
          savedTransaction.error || 'Could not save transaction to PostgreSQL.'
        )
      }

      alert(`Transaction ${savedTransaction.transaction_reference} saved successfully.`)


      if (['MEDIUM', 'HIGH', 'CRITICAL'].includes(String(data.risk_level).toUpperCase())) {
        const incidentResponse = await fetch(
          'http://localhost:7070/api/incidents',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              incident_reference: `INC-${Date.now()}`,
              title: 'Suspicious transaction detected',
              category: 'Fraud',
              related_reference: transactionReference,
              severity:
                data.risk_level === 'HIGH'
                  ? 'High'
                  : data.risk_level === 'CRITICAL'
                    ? 'Critical'
                    : 'Medium',
              status: 'Open',
              notes: `Amount: ₹${amount}; Transactions in last hour: ${velocity}; Account age: ${accountAge} days; Foreign transaction: ${foreignTransaction}. ${data.message ?? ''}`,
            }),
          }
        )

        if (!incidentResponse.ok) {
          throw new Error('Prediction succeeded, but incident creation failed.')
        }

        alert('Fraud alert detected! An incident was created.')
      }

    } catch (error) {
      setFraudError(
        error instanceof Error
          ? error.message
          : 'Could not connect to the Python fraud API.'
      )
    } finally {
      setFraudLoading(false)
    }
  }


  const trendData = {
    labels: ['01 Jun', '05 Jun', '09 Jun', '13 Jun', '17 Jun', '21 Jun', '25 Jun', '30 Jun'],
    datasets: [{ label: 'Revenue', data: [42, 58, 48, 72, 64, 91, 78, 106], borderColor: '#12b8a6', backgroundColor: 'rgba(18,184,166,.11)', fill: true, tension: .42, pointRadius: 0, pointHoverRadius: 5 }],
  }
  
  const fraudData = {
    labels: ['Low risk', 'Medium', 'High', 'Critical'],
    datasets: [
      {
        data: riskDistribution.counts,
        backgroundColor: ['#12b8a6', '#f3c969', '#eb8b6b', '#c94b62'],
        borderWidth: 0,
        hoverOffset: 5,
      },
    ],
  };

  
const inventorySummary = useMemo(() => {
  const categories = new Map<string, number>();

  liveProducts.forEach((product) => {
    categories.set(
      product.category,
      (categories.get(product.category) ?? 0) + product.stock
    );
  });

  return {
    labels: Array.from(categories.keys()),
    values: Array.from(categories.values()),
  };
}, [liveProducts]);

  const inventoryData = {
    labels: inventorySummary.labels,
    datasets: [
      {
        label: 'Current stock',
        data: inventorySummary.values,
        backgroundColor: ['#12b8a6', '#76c9c0', '#adcac7', '#d9e2dd'],
        borderRadius: 7,
        borderSkipped: false as const,
        barThickness: 14,
      },
    ],
  };


  return (
    <main className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="brand"><div className="brand-mark"><ShieldCheck /></div><div><strong>NEXUS <span>GUARD</span></strong><small>COMMERCE INTELLIGENCE</small></div><button className="mobile-close" onClick={() => setMenuOpen(false)} aria-label="Close navigation"><X /></button></div>
        <div className="workspace-switcher"><div className="workspace-icon"><Store /></div><div><small>WORKSPACE</small><strong>Aurelia Commerce</strong></div><ChevronDown className="workspace-chevron" /></div>
        <nav className="side-nav" aria-label="Main navigation"><p className="nav-label">COMMAND CENTER</p>{navItems.map((item) => <button key={item.label} onClick={() => { 
          router.push(item.label === 'Overview'? '/' : item.label === 'Incident center' ? '/incidents' : `/${item.label.toLowerCase().replaceAll(' ', '-')}` ); setMenuOpen(false) }} className={`nav-item ${activeNav.toLowerCase() === item.label.toLowerCase() ? 'active' : ''}`}><item.icon /><span>{item.label}</span>{item.count && <em>{item.count}</em>}</button>)}<p className="nav-label secondary-label">SYSTEM</p><button className={`nav-item ${pathname === '/settings' ? 'active' : ''}`} onClick={() => router.push('/settings')}><Settings2 /><span>Settings</span></button><button className={`nav-item ${pathname === '/help' ? 'active' : ''}`} onClick={() => router.push('/help')}><CircleHelp /><span>Help center</span></button></nav>
        <div className="sidebar-bottom"><div className="status-line"><span className="online-dot" />All systems operational</div><div className="profile"><div className="avatar avatar-teal">AR</div><div><strong>Alex Rivera</strong><small>Security admin</small></div><LogOut /></div></div>
      </aside>

      <section className="content-area">
        <header className="topbar"><button className="mobile-menu" onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu /></button><div className="breadcrumbs"><span>Command center</span><span>/</span><strong>{activeNav}</strong></div><div className="topbar-actions"><button className="icon-button" aria-label="Search" onClick={() => setSearchOpen(!searchOpen)}><Search /></button><button className="icon-button notification-button" aria-label="Notifications" onClick={() => setNotificationsOpen(!notificationsOpen)}><Bell /><i /></button><button className="top-avatar" aria-label="Open profile menu" onClick={() => setProfileOpen(!profileOpen)}>AR</button></div></header>{searchOpen && <div className="panel" style={{ position: 'absolute', right: 42, top: 58, zIndex: 10, padding: 12 }}><input autoFocus placeholder="Search NEXUS GUARD..." aria-label="Search NEXUS GUARD" /></div>}{notificationsOpen && <div className="panel" role="status" style={{ position: 'absolute', right: 80, top: 58, zIndex: 10, padding: 16, width: 260 }}><strong>Notifications</strong><p className="subtitle">3 priority alerts need attention.</p></div>}{profileOpen && <div className="panel" style={{ position: 'absolute', right: 24, top: 58, zIndex: 10, padding: 8, width: 180 }}><button className="nav-item" onClick={() => router.push('/settings')}>My Profile</button><button className="nav-item" onClick={() => router.push('/settings')}>Account Settings</button><button className="nav-item" onClick={() => router.push('/help')}>Help &amp; Support</button><button className="nav-item" onClick={() => setProfileOpen(false)}><LogOut /> Sign Out</button></div>}
        <div className="page-content">
          {pathname !== '/' ? <RoutePage pathname={pathname} onSave={() => setSaved(true)} /> : <>
          {saved && <div className="analysis-result" role="status">Preferences saved for this session.</div>}
          <div className="welcome-row"><div><p className="overline"><span className="live-pulse" />LIVE MONITORING</p><h1>Good morning, Alex <span>↗</span></h1><p className="subtitle">Here&apos;s what&apos;s happening across your commerce network.</p></div><div className="header-actions"><button className="secondary-button" onClick={() => setCustomizeOpen(true)}><SlidersHorizontal /> Customize</button>{customizeOpen && <div className="modal-backdrop" onClick={() => setCustomizeOpen(false)}><section className="playground-modal" onClick={(e) => e.stopPropagation()}><h2>Customize dashboard</h2><p className="subtitle">Choose which monitoring areas to prioritize.</p><label className="playground-fields"><span>Density<select defaultValue="Comfortable"><option>Comfortable</option><option>Compact</option></select></span></label><button className="primary-button" onClick={() => setCustomizeOpen(false)}>Apply changes</button></section></div>}
          <button
            className="secondary-button"
            onClick={() => void loadDashboardData()}
            disabled={dashboardLoading}
          >
            <Database />
            {dashboardLoading ? 'Refreshing...' : 'Refresh Data'}
          </button>

          <button
            className="primary-button"
            onClick={() => setPlaygroundOpen(true)}
          >
            <Sparkles /> Fraud playground
          </button></div></div>
                    
          {dashboardLoading && (
            <p className="subtitle">Loading live dashboard data...</p>
          )}

          {dashboardError && (
            <div className="analysis-result" role="alert">
              {dashboardError}
            </div>
          )}

          <div className="kpi-grid">
            <StatCard
              label="Inventory value"
              value={`₹${liveProducts
                .reduce((total, product) => total + product.stock * product.price, 0)
                .toLocaleString('en-IN')}`}
              change="Live"
              positive
              icon={ShoppingBag}
              accent="teal"
            />

            <StatCard
              label="Transactions screened"
              value={liveTransactions.length.toLocaleString('en-IN')}
              change="Live"
              positive
              icon={Fingerprint}
              accent="blue"
            />

            <StatCard
              label="High-risk transactions"
              value={liveTransactions.filter((tx) =>
                ['HIGH', 'CRITICAL'].includes(tx.risk_level.toUpperCase())
              ).length.toLocaleString('en-IN')}
              change="Live"
              icon={ShieldCheck}
              accent="green"
            />

            <StatCard
              label="Low-stock products"
              value={liveProducts.filter(
                (product) => product.stock <= product.threshold
              ).length.toLocaleString('en-IN')}
              change="Live"
              icon={AlertTriangle}
              accent="amber"
            />
          </div>
          <div className="dashboard-grid top-charts"><section className="panel revenue-panel"><div className="panel-heading"><div><h2>Revenue overview</h2><p>Net revenue performance</p></div><div className="panel-tools"><span className="legend-dot" />Revenue <select value={range} onChange={(e) => setRange(e.target.value)} aria-label="Revenue date range"><option>30 days</option><option>7 days</option><option>90 days</option></select></div></div><div className="chart-wrap line-chart"><Line data={trendData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { backgroundColor: '#101828', padding: 12, displayColors: false, callbacks: { label: (context) => `$${context.raw}k revenue` } } }, scales: { x: { grid: { display: false }, border: { display: false }, ticks: { color: '#8a96a3', font: { size: 11 } } }, y: { grid: { color: '#edf0ee' }, border: { display: false }, ticks: { color: '#8a96a3', font: { size: 11 }, callback: (value) => `$${value}k` } } } }} /></div></section><section className="panel risk-panel"><div className="panel-heading"><div><h2>Risk distribution</h2><p>All screened transactions</p></div><button className="more-button" aria-label="More options">•••</button></div><div className="risk-chart"><Doughnut data={fraudData} options={{ cutout: '72%', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { backgroundColor: '#101828', padding: 10 } } }} />
          <div className="donut-center"><strong>{riskDistribution.total.toLocaleString('en-IN')}</strong><span>screened</span></div></div>
          <div className="risk-legend">
            {[
              ['Low risk', '#12b8a6'],
              ['Medium', '#f3c969'],
              ['High', '#eb8b6b'],
              ['Critical', '#c94b62'],
            ].map(([label, color], index) => (
              <div key={label}>
                <span style={{ background: color }} />
                {label}
                <b>{riskDistribution.percentages[index]}%</b>
                </div>))}
                </div></section></div>

          <div className="section-heading"><div><p className="overline">SECURITY OPERATIONS</p><h2>Transaction intelligence</h2></div><button className="text-button">View all transactions <ArrowUpRight /></button></div>
          <section className="panel transactions-panel"><div className="table-toolbar"><div className="search-field"><Search /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search transactions..." /></div>
          <div className="filter-wrapper">
            <SlidersHorizontal />
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              aria-label="Filter transactions by risk"
              className="risk-filter-select"
            >
              <option value="ALL">All risks</option>
              <option value="LOW">Low risk</option>
              <option value="MEDIUM">Medium risk</option>
              <option value="HIGH">High risk</option>
              <option value="CRITICAL">Critical risk</option>
            </select>
                        
            <select
              className="compact-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort transactions"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="amount">Highest amount</option>
              <option value="risk">Highest risk score</option>
            </select>


          </div><button className="export-button" onClick={exportTransactions} disabled={liveTransactions.length === 0}><Database /> Export</button></div><div className="table-scroll"><table><thead><tr><th>Transaction</th><th>Customer</th><th>Amount</th><th>Payment method</th><th>Risk score</th><th>Status</th><th>Time</th><th /></tr></thead><tbody>{filteredTransactions.map((tx) => <tr key={tx.id}><td><div className="tx-id"><span className="tx-icon"><CreditCard /></span><div><strong>{tx.id}</strong><small>Order #{tx.id.slice(-4)}</small></div></div></td><td><div className="customer"><span className="avatar">{tx.initials}</span>{tx.customer}</div></td><td><strong className="amount">{tx.amount}</strong></td><td className="muted-cell">{tx.method}</td><td><div className="score"><span className={`score-bar ${tx.risk.toLowerCase()}`}><i style={{ width: `${tx.score}%` }} /></span><b>{tx.score}</b></div></td><td><RiskBadge risk={tx.risk} /></td><td className="muted-cell">{tx.time}</td><td><button className="row-more">•••</button></td></tr>)}</tbody></table></div></section>

          <div className="dashboard-grid bottom-grid">
            <section className="panel inventory-panel">
              <div className="panel-heading">
                <div>
                  <h2>Inventory health</h2>
                  <p>Current stock by category</p>
                </div>
                <button className="more-button">•••</button>
              </div>
              <div className="chart-wrap bar-chart">
                <Bar data={inventoryData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { backgroundColor: '#101828', padding: 10 } }, scales: { x: { grid: { display: false }, border: { display: false }, ticks: { color: '#8a96a3', font: { size: 11 } } }, y: { grid: { color: '#edf0ee' }, border: { display: false }, ticks: { color: '#8a96a3', font: { size: 10 } } } } }} />
              </div>                            
              <div className="inventory-footer">
                {[
                  {
                    label: 'Healthy stock',
                    count: liveProducts.filter(
                      (p) => p.stock > p.threshold
                    ).length,
                    className: 'safe',
                  },
                  {
                    label: 'Low stock',
                    count: liveProducts.filter(
                      (p) => p.stock > 0 && p.stock <= p.threshold
                    ).length,
                    className: 'low',
                  },
                  {
                    label: 'Out of stock',
                    count: liveProducts.filter(
                      (p) => p.stock === 0
                    ).length,
                    className: 'out',
                  },
                ].map((item) => {
                  const percentage =
                    liveProducts.length === 0
                      ? 0
                      : Math.round(
                          (item.count / liveProducts.length) * 100
                        );

                  return (
                    <div key={item.label}>
                      <span className={`stock-indicator ${item.className}`} />
                      {item.label}
                      <b>{percentage}%</b>
                    </div>
                  );
                })}
              </div>

                </section><section className="panel alerts-panel"><div className="panel-heading"><div><h2>Priority alerts</h2><p>Needs your attention</p></div><span className="alert-count">{priorityAlerts.length} alerts</span></div>
                <div className="alert-list">
                  {priorityAlerts.length === 0 ? (
                    <p className="subtitle">No priority alerts. Everything looks good!</p>
                  ) : (
                    priorityAlerts.map((alert) => (
                      <div className={`alert-item ${alert.level}`} key={alert.id}>
                        <span className="alert-icon">
                          {alert.type === 'transaction' ? (
                            <AlertTriangle />
                          ) : (
                            <PackageSearch />
                          )}
                        </span>

                        <div>
                          <strong>{alert.title}</strong>
                          <p>{alert.description}</p>
                          <small>{alert.time}</small>
                        </div>

                        <ChevronDown />
                      </div>
                    ))
                  )}
                </div>
                  <button className="view-alerts" onClick={() => router.push('/incidents')}> Open incident center <ArrowUpRight /></button>
                  </section></div>
          </>}
        </div>
      </section>
            
      {playgroundOpen && (
        <div
          className="modal-backdrop"
          onClick={() => setPlaygroundOpen(false)}
        >
          <section
            className="playground-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-top">
              <div>
                <p className="overline">MODEL SANDBOX</p>
                <h2>Fraud playground</h2>
                <p>Analyze a hypothetical transaction using your Python ML API.</p>
              </div>
              <button
                className="icon-button"
                onClick={() => setPlaygroundOpen(false)}
                aria-label="Close playground"
              >
                <X />
              </button>
            </div>

            <div className="playground-fields">
              <label>
                Transaction amount (₹)
                <input
                  type="number"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </label>

              <label>
                Transactions in the last hour
                <input
                  type="number"
                  min="0"
                  value={velocity}
                  onChange={(e) => setVelocity(e.target.value)}
                />
              </label>

              <label>
                Account age (days)
                <input
                  type="number"
                  min="0"
                  value={accountAge}
                  onChange={(e) => setAccountAge(e.target.value)}
                />
              </label>

              <label>
                Foreign transaction
                <select
                  value={String(foreignTransaction)}
                  onChange={(e) =>
                    setForeignTransaction(e.target.value === 'true')
                  }
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </label>
            </div>

            {fraudError && (
              <div className="analysis-result" role="alert">
                <strong>Prediction failed</strong>
                <p>{fraudError}</p>
                <p>Check that your Python API is running on port 8000.</p>
              </div>
            )}

            {fraudPrediction && (
              <div
                className={`analysis-result ${
                  fraudPrediction.risk_level.toLowerCase()
                }`}
                role="status"
              >
                <div className="result-score">
                  <strong>{fraudPrediction.risk_score}%</strong>
                  <span>Model risk score</span>
                </div>

                <div>
                  <RiskBadge
                    risk={
                      fraudPrediction.risk_level === 'HIGH'
                        ? 'High'
                        : fraudPrediction.risk_level === 'MEDIUM'
                          ? 'Medium'
                          : 'Low'
                    }
                  />
                  <p>
                    {fraudPrediction.is_fraud
                      ? 'Suspicious transaction detected.'
                      : 'The model did not flag this transaction as fraud.'}
                  </p>

                  
                  <div className="risk-factors">
                    <strong>Risk Factors Detected</strong>
                    {fraudPrediction.risk_factors.length > 0 ? (
                      <ul>
                        {fraudPrediction.risk_factors.map((factor) => (
                          <li key={factor}>{factor}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>No predefined risk indicators detected.</p>
                    )}
                  </div>
                  
                  <div className="shap-explanations">
                    <strong>AI Feature Explanations (SHAP)</strong>
                    <p className="shap-description">
                      Each value shows a feature's contribution to the model output.
                      Positive values push the prediction toward fraud; negative values
                      push it away. These are not percentages, and contributions can
                      vary with interactions between features.
                    </p>

                    {fraudPrediction.feature_explanations.map((item) => (
                      <div className="shap-feature" key={item.feature}>
                        <div className="shap-feature-header">
                          <span>
                            {item.feature.replaceAll('_', ' ')}
                          </span>
                          <span
                            className={`shap-direction ${item.direction}`}
                          >
                            {item.direction}
                          </span>
                        </div>

                        <div className="shap-impact">
                          Impact: {item.impact > 0 ? '+' : ''}
                          {item.impact.toFixed(4)}
                        </div>
                      </div>
                    ))}
                  </div>

                </div>

                <p>{fraudPrediction.message}</p>
                <p className="demo-note">{fraudPrediction.disclaimer}</p>
              </div>
            )}

            <div className="modal-actions">
              <button
                className="secondary-button"
                onClick={() => {
                  setAmount('2480')
                  setVelocity('7')
                  setAccountAge('2')
                  setForeignTransaction(true)
                  setFraudPrediction(null)
                  setFraudError('')
                }}
              >
                Reset
              </button>

              <button
                className="primary-button"
                onClick={analyzeFraud}
                disabled={fraudLoading}
              >
                <Sparkles />
                {fraudLoading ? 'Analyzing...' : 'Analyze transaction'}
              </button>
            </div>
          </section>
        </div>
      )}

    </main>
  );
}

