class MoveController < ApplicationController

protect_from_forgery :except => :create 

  def index
    params.require(:from_state)
    params.require(:transform)
    to_state = next_state(Integer(params[:from_state]))
    render json: { to_state: to_state, transform: params[:transform] }, status: :ok
  end
  
  def create
    params.require(:from_state)
    params.require(:to_state)
    params.require(:transform)
    
    move = Move.where(:from_state => params[:from_state], :to_state => params[:to_state]).first_or_create
    move.increment!(:count)
    to_state = next_state(params[:to_state])
    render json: { from_state: params[:to_state], to_state: to_state, transform: params[:transform] }, status: :ok
  end
  
  def next_state(from_state)
    moves = Move.all(:conditions => [ "from_state = ?", from_state])
    count_total = moves.inject(0) { |sum, move| sum+move[:count] }
    random_index = rand count_total
    count_covered = 0
    to_state = -1
    moves.each do |move|
      count_covered += move[:count]
      if (count_covered > random_index)
        to_state = move[:to_state]
        break
      end
    end
    to_state
  end
  
  def respond_with_error(error, status = :error)
    render json: {:error => error}, status: status
  end

end
