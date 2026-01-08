'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Transaction = {
  id: number
  product_id: number
  type: 'IN' | 'OUT'
  quantity: number
  created_at: string
  products: {
    name: string
  }
}

type Product = {
  id: number
  name: string
  quantity: number
}

export default function Inventory() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  
  const [newTransaction, setNewTransaction] = useState({
    product_id: '',
    type: 'IN',
    quantity: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    // Fetch products for dropdown
    const { data: productsData } = await supabase
      .from('products')
      .select('id, name, quantity')
      .order('name')
    
    if (productsData) setProducts(productsData)

    // Fetch transactions
    const { data: transactionsData, error } = await supabase
      .from('transactions')
      .select(`
        *,
        products (
          name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      alert('获取记录失败: ' + error.message)
    } else {
      setTransactions(transactionsData || [])
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTransaction.product_id || !newTransaction.quantity) return

    const quantity = parseInt(newTransaction.quantity)
    if (quantity <= 0) {
      alert('数量必须大于0')
      return
    }

    // Check stock for OUT transactions
    if (newTransaction.type === 'OUT') {
      const product = products.find(p => p.id === parseInt(newTransaction.product_id))
      if (product && product.quantity < quantity) {
        alert('库存不足！当前库存: ' + product.quantity)
        return
      }
    }

    // Call the RPC function
    const { error } = await supabase.rpc('handle_inventory_transaction', {
      p_product_id: parseInt(newTransaction.product_id),
      p_type: newTransaction.type,
      p_quantity: quantity
    })

    if (error) {
      alert('操作失败: ' + error.message)
    } else {
      setNewTransaction({ product_id: '', type: 'IN', quantity: '' })
      fetchData()
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">库存记录</h2>
        <p className="text-sm text-gray-500">记录和查看商品的入库与出库明细</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transaction Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">新增操作</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">选择商品</label>
                <select
                  required
                  value={newTransaction.product_id}
                  onChange={(e) => setNewTransaction({ ...newTransaction, product_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                >
                  <option value="">请选择商品</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (当前库存: {p.quantity})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">操作类型</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewTransaction({ ...newTransaction, type: 'IN' })}
                    className={`py-2 rounded-xl text-sm font-semibold transition-all ${
                      newTransaction.type === 'IN'
                        ? 'bg-green-600 text-white shadow-sm'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    入库
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewTransaction({ ...newTransaction, type: 'OUT' })}
                    className={`py-2 rounded-xl text-sm font-semibold transition-all ${
                      newTransaction.type === 'OUT'
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    出库
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">数量</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={newTransaction.quantity}
                  onChange={(e) => setNewTransaction({ ...newTransaction, quantity: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="输入操作数量"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-2 rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-sm mt-2"
              >
                提交操作
              </button>
            </form>
          </div>
        </div>

        {/* Transactions List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-bold text-gray-900">最近 50 条记录</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600">时间</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600">商品</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600">类型</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600">数量</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <div className="inline-block w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      </td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                        暂无库存变动记录
                      </td>
                    </tr>
                  ) : (
                    transactions.map((t) => (
                      <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(t.created_at).toLocaleString('zh-CN', {
                            month: 'numeric',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{t.products?.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            t.type === 'IN' 
                              ? 'bg-green-50 text-green-700' 
                              : 'bg-red-50 text-red-700'
                          }`}>
                            {t.type === 'IN' ? '入库' : '出库'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-gray-700">
                          {t.type === 'IN' ? '+' : '-'}{t.quantity}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}