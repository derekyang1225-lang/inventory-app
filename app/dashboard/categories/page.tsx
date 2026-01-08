'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Category = {
  id: number
  name: string
  created_at: string
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [newCategory, setNewCategory] = useState('')
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      alert('获取分类失败: ' + error.message)
    } else {
      setCategories(data || [])
    }
    setLoading(false)
  }

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategory.trim()) return

    const { error } = await supabase
      .from('categories')
      .insert([{ name: newCategory }])

    if (error) {
      alert('添加分类失败: ' + error.message)
    } else {
      setNewCategory('')
      fetchCategories()
    }
  }

  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCategory || !editingCategory.name.trim()) return

    const { error } = await supabase
      .from('categories')
      .update({ name: editingCategory.name })
      .eq('id', editingCategory.id)

    if (error) {
      alert('更新分类失败: ' + error.message)
    } else {
      setEditingCategory(null)
      fetchCategories()
    }
  }

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('确定要删除这个分类吗？这可能会影响关联的商品。')) return

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)

    if (error) {
      alert('删除失败: ' + error.message)
    } else {
      fetchCategories()
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">分类管理</h2>
        <p className="text-sm text-gray-500">组织和管理您的商品分类</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add/Edit Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingCategory ? '编辑分类' : '新增分类'}
            </h3>
            <form onSubmit={editingCategory ? handleEditCategory : handleAddCategory} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">分类名称</label>
                <input
                  type="text"
                  value={editingCategory ? editingCategory.name : newCategory}
                  onChange={(e) => editingCategory 
                    ? setEditingCategory({ ...editingCategory, name: e.target.value })
                    : setNewCategory(e.target.value)
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="例如：电子产品"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-sm"
                >
                  {editingCategory ? '更新' : '添加'}
                </button>
                {editingCategory && (
                  <button
                    type="button"
                    onClick={() => setEditingCategory(null)}
                    className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                  >
                    取消
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Categories List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-bold text-gray-900">所有分类</h3>
            </div>
            <ul className="divide-y divide-gray-100">
              {loading ? (
                <li className="px-6 py-12 text-center">
                  <div className="inline-block w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                </li>
              ) : categories.length === 0 ? (
                <li className="px-6 py-12 text-center text-gray-500">
                  暂无分类数据
                </li>
              ) : (
                categories.map((category) => (
                  <li key={category.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors group">
                    <div>
                      <div className="font-medium text-gray-900">{category.name}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        创建于 {new Date(category.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditingCategory(category)}
                        className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="text-red-600 hover:text-red-900 text-sm font-medium"
                      >
                        删除
                      </button>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}