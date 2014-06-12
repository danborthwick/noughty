class MoveController < ApplicationController

protect_from_forgery :except => :create 

  def index
    params.require(:from_state)
    @move = next_state(Integer(params[:from_state]))
    render json: { to_state: 12345, count: @move.length }, status: :ok
  end
  
  def create
    params.require(:from_state)
    params.require(:to_state)
    @move = Move.where(:from_state => params[:from_state], :to_state => params[:to_state]).first_or_create
    @move.increment!(:count)
    @to_state = next_state(params[:to_state])
    render json: { from_state: params[:to_state], to_state: @to_state}, status: :ok
  end
  
  def next_state(from_state)
    @moves = Move.all(:conditions => [ "from_state = ?", from_state])
    @moves.first || 42
  end
  
  def respond_with_error(error, status = :error)
    render json: {:error => error}, status: status
  end

end
