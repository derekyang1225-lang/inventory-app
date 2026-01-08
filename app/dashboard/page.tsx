'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { Package, Tags, Archive, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

export default function Dashboard() {
  const [stats, setStats] = useState({
    products: 0,
    categories: 0,
    totalStock: 0
  })
  const [categoryData, setCategoryData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUserAndFetchStats()
  }, [])

  const checkUserAndFetchStats = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }
    fetchStats()
  }

  const fetchStats = async () => {
    // Fetch basic counts
    const { count: productsCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })

    const { count: categoriesCount } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true })

    // Fetch products for aggregation
    const { data: products } = await supabase
      .from('products')
      .select(`
        quantity,
        categories (
          name
        )
      `)

    const totalStock = products?.reduce((sum, p) => sum + (p.quantity || 0), 0) || 0

    // Aggregate data for charts
    const categoryMap = new Map()
    products?.forEach((p: any) => {
      const categoryName = p.categories?.name || '未分类'
      const current = categoryMap.get(categoryName) || 0
      categoryMap.set(categoryName, current + (p.quantity || 0))
    })

    const chartData = Array.from(categoryMap.entries()).map(([name, value]) => ({
      name,
      value
    }))

    setStats({
      products: productsCount || 0,
      categories: categoriesCount || 0,
      totalStock
    })
    setCategoryData(chartData)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">仪表盘概览</h2>
        <p className="mt-1 text-sm text-gray-500">查看您的库存实时状态</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 transition-transform hover:scale-[1.02]">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-400">商品总数</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.products}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 transition-transform hover:scale-[1.02]">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-50 rounded-xl">
              <Tags className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm font-medium text-gray-400">分类数量</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.categories}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 transition-transform hover:scale-[1.02]">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-50 rounded-xl">
              <Archive className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-gray-400">总库存量</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalStock}</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">库存分布 (按分类)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: '#F3F4F6' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">库存占比</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-8 text-white">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="mb-6 md:mb-0">
            <h2 className="text-2xl font-bold mb-2">准备好开始管理了吗？</h2>
            <p className="text-indigo-100">快速访问常用功能，提高工作效率。</p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link 
              href="/dashboard/products"
              className="px-6 py-3 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition-colors flex items-center"
            >
              管理商品
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
            <Link 
              href="/dashboard/inventory"
              className="px-6 py-3 bg-indigo-500 bg-opacity-30 text-white border border-white/20 rounded-xl font-semibold hover:bg-opacity-40 transition-colors flex items-center"
            >
              库存操作
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}