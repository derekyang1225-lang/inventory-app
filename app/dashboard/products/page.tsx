'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Search, Filter, Plus, Edit2, Trash2, X } from 'lucide-react'

type Product = {
  id: number
  name: string
  category_id: number
  quantity: number
  price: number
  categories: {
    name: string
  }
}

type Category = {
  id: number
  name: string
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  
  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const [newProduct, setNewProduct] = useState({
    name: '',
    category_id: '',
    price: '',
    quantity: '0'
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    // Fetch categories for the dropdown
    const { data: categoriesData } = await supabase
      .from('categories')
      .select('*')
      .order('name')
    
    if (categoriesData) setCategories(categoriesData)

    // Fetch products with category info
    const { data: productsData, error } = await supabase
      .from('products')
      .select(`
        *,
        categories (
          name
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      alert('获取商品失败: ' + error.message)
    } else {
      setProducts(productsData || [])
    }
    setLoading(false)
  }

  // Filtered products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || product.category_id?.toString() === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProduct.name || !newProduct.category_id || !newProduct.price) {
      alert('请填写完整信息')
      return
    }

    const { error } = await supabase
      .from('products')
      .insert([{
        name: newProduct.name,
        category_id: parseInt(newProduct.category_id),
        price: parseFloat(newProduct.price),
        quantity: parseInt(newProduct.quantity)
      }])

    if (error) {
      alert('添加商品失败: ' + error.message)
    } else {
      setNewProduct({ name: '', category_id: '', price: '', quantity: '0' })
      setShowAddForm(false)
      fetchData()
    }
  }

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProduct) return

    const { error } = await supabase
      .from('products')
      .update({
        name: editingProduct.name,
        category_id: editingProduct.category_id,
        price: editingProduct.price,
        quantity: editingProduct.quantity
      })
      .eq('id', editingProduct.id)

    if (error) {
      alert('更新商品失败: ' + error.message)
    } else {
      setEditingProduct(null)
      fetchData()
    }
  }

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('确定要删除这个商品吗？')) return

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (error) {
      alert('删除失败: ' + error.message)
    } else {
      fetchData()
    }
  }

  const startEditing = (product: Product) => {
    setEditingProduct({
      ...product,
      category_id: product.category_id || 0
    })
    setShowAddForm(false)
  }

  const cancelEditing = () => {
    setEditingProduct(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">商品管理</h2>
          <p className="text-sm text-gray-500">管理您的库存商品信息</p>
        </div>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm)
            setEditingProduct(null)
          }}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-sm font-medium"
        >
          {showAddForm ? (
            <>
              <X className="w-4 h-4 mr-2" />
              取消添加
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              添加商品
            </>
          )}
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="搜索商品名称..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white appearance-none"
          >
            <option value="all">所有分类</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingProduct) && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-in fade-in slide-in-from-top-4 duration-200">
          <h3 className="text-lg font-bold text-gray-900 mb-6">
            {editingProduct ? '编辑商品' : '新增商品'}
          </h3>
          <form onSubmit={editingProduct ? handleEditProduct : handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">商品名称</label>
              <input
                type="text"
                required
                value={editingProduct ? editingProduct.name : newProduct.name}
                onChange={(e) => editingProduct 
                  ? setEditingProduct({ ...editingProduct, name: e.target.value })
                  : setNewProduct({ ...newProduct, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                placeholder="例如：MacBook Pro"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">所属分类</label>
              <select
                required
                value={editingProduct ? editingProduct.category_id : newProduct.category_id}
                onChange={(e) => editingProduct
                  ? setEditingProduct({ ...editingProduct, category_id: parseInt(e.target.value) })
                  : setNewProduct({ ...newProduct, category_id: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              >
                <option value="">请选择分类</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">单价 (¥)</label>
              <input
                type="number"
                step="0.01"
                required
                value={editingProduct ? editingProduct.price : newProduct.price}
                onChange={(e) => editingProduct
                  ? setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })
                  : setNewProduct({ ...newProduct, price: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {editingProduct ? '当前库存' : '初始库存'}
              </label>
              <input
                type="number"
                required
                value={editingProduct ? editingProduct.quantity : newProduct.quantity}
                onChange={(e) => editingProduct
                  ? setEditingProduct({ ...editingProduct, quantity: parseInt(e.target.value) })
                  : setNewProduct({ ...newProduct, quantity: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div className="md:col-span-2 flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-indigo-600 text-white py-2 rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-sm"
              >
                {editingProduct ? '更新商品' : '保存商品'}
              </button>
              {editingProduct && (
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="px-6 py-2 bg-gray-100 text-gray-600 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                >
                  取消
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">商品名称</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">分类</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">价格</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">库存状态</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="inline-block w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    {searchTerm || selectedCategory !== 'all' ? '没有找到匹配的商品' : '暂无商品数据，请先添加商品'}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{product.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        {product.categories?.name || '未分类'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                      ¥{product.price.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className={`w-2 h-2 rounded-full mr-2 ${
                          product.quantity > 10 ? 'bg-green-500' : product.quantity > 0 ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        <span className="text-sm text-gray-600">{product.quantity} 件</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <button
                        onClick={() => startEditing(product)}
                        className="text-indigo-600 hover:text-indigo-900 transition-colors p-2 rounded-lg hover:bg-indigo-50 inline-flex items-center"
                        title="编辑"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="text-red-600 hover:text-red-900 transition-colors p-2 rounded-lg hover:bg-red-50 inline-flex items-center"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}