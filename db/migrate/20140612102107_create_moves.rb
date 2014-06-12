class CreateMoves < ActiveRecord::Migration
  def change
    create_table :moves do |t|
      t.integer :from
      t.integer :to

      t.timestamps
    end
  end
end
