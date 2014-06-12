class CreateMoves < ActiveRecord::Migration
  def change
    create_table :moves do |t|
      t.integer :from_state
      t.integer :to_state
      t.integer :count
    end
  end
end
