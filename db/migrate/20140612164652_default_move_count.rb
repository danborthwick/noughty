class DefaultMoveCount < ActiveRecord::Migration
  def change
    change_column :moves, :count, :integer, :default => 1
  end
end
