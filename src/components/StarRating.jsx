import { useState } from "react"

const StarRating = ({ rating, maxRating = 10, showNumber = true, size = 16 }) => {
  // Convert 10-point scale to 5-star scale
  const starRating = (rating / maxRating) * 5

  const renderStars = () => {
    const stars = []
    const fullStars = Math.floor(starRating)
    const hasHalfStar = starRating % 1 >= 0.3
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

    // Full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <span key={`full-${i}`} className="star full">
          ★
        </span>
      )
    }

    // Half star
    if (hasHalfStar) {
      stars.push(
        <span key="half" className="star half">
          ★
        </span>
      )
    }

    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <span key={`empty-${i}`} className="star empty">
          ★
        </span>
      )
    }

    return stars
  }

  return (
    <div className="star-rating" style={{ fontSize: `${size}px` }}>
      <div className="stars">
        {renderStars()}
      </div>
      {showNumber && (
        <span className="rating-number">
          {rating}/10
        </span>
      )}
    </div>
  )
}

export default StarRating