class Move < ActiveRecord::Base
  validates :from_state, :to_state, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :count, numericality: { only_integer: true, greater_than_or_equal_to: 1 }
end
