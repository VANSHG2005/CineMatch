import { useState, useEffect } from 'react';
import { commentsApi } from '../services/api';
import UserAvatar from './UserAvatar';

const StarRating = ({ value, onChange, readonly = false }) => {
  const [hovered, setHovered] = useState(0);
  const display = readonly ? value : (hovered || value);
  return (
    <div style={{ display: 'flex', gap: '3px' }}>
      {[1, 2, 3, 4, 5].map(star => (
        <span
          key={star}
          onClick={() => !readonly && onChange && onChange(star === value ? 0 : star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          style={{
            cursor: readonly ? 'default' : 'pointer',
            fontSize: readonly ? '0.85rem' : '1.2rem',
            color: star <= display ? '#f5c518' : '#333',
            transition: 'color 0.1s'
          }}
        >★</span>
      ))}
    </div>
  );
};

const Comments = ({ itemId, itemType, currentUser }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [posting, setPosting] = useState(false);

  useEffect(() => { fetchComments(); }, [itemId, itemType]);

  const fetchComments = async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await commentsApi.getComments(itemId, itemType);
      setComments(response.data);
    } catch (err) {
      console.error("Failed to fetch comments", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setPosting(true);
    try {
      const response = await commentsApi.postComment({
        item_id: itemId,
        item_type: itemType,
        text: newComment,
        rating: rating || null
      });
      setComments([response.data, ...comments]);
      setNewComment('');
      setRating(0);
    } catch {
      alert("Failed to post comment. Please try again.");
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await commentsApi.deleteComment(commentId);
      setComments(comments.filter(c => c.id !== commentId));
    } catch {
      alert("Failed to delete comment.");
    }
  };

  // Average rating from comments that have one
  const ratedComments = comments.filter(c => c.rating > 0);
  const avgRating = ratedComments.length
    ? (ratedComments.reduce((sum, c) => sum + c.rating, 0) / ratedComments.length).toFixed(1)
    : null;

  return (
    <section style={{ marginTop: '50px', borderTop: '1px solid var(--border-color)', paddingTop: '40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <h2 className="section-title" style={{ margin: 0 }}>Discussion</h2>
        {avgRating && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--card-bg)', padding: '6px 14px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
            <span style={{ color: '#f5c518', fontSize: '1rem' }}>★</span>
            <span style={{ fontWeight: '700', fontSize: '1rem' }}>{avgRating}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>/ 5 · {ratedComments.length} {ratedComments.length === 1 ? 'rating' : 'ratings'}</span>
          </div>
        )}
      </div>

      {currentUser ? (
        <form onSubmit={handleSubmit} style={{ marginBottom: '40px', background: 'var(--card-bg)', padding: '20px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', gap: '15px' }}>
            <UserAvatar name={currentUser.name} src={currentUser.profile_pic} size="small" />
            <div style={{ flex: 1 }}>
              {/* Star rating */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Your rating:</span>
                <StarRating value={rating} onChange={setRating} />
                {rating > 0 && (
                  <button type="button" onClick={() => setRating(0)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem' }}>
                    Clear
                  </button>
                )}
              </div>
              <textarea
                className="form-input"
                placeholder="Share your thoughts..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                style={{ minHeight: '80px', marginBottom: '10px', resize: 'vertical' }}
                required
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn-auth" disabled={posting} style={{ width: 'auto', padding: '8px 25px', marginTop: 0 }}>
                  {posting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div style={{ padding: '20px', background: 'var(--card-bg)', borderRadius: '8px', textAlign: 'center', marginBottom: '40px' }}>
          <p style={{ color: 'var(--text-muted)' }}>Please <a href="/login" style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>login</a> to join the discussion.</p>
        </div>
      )}

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading comments...</p>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
          <p>Unable to load comments.</p>
          <button onClick={fetchComments} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', marginTop: '10px' }}>Try Again</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          {comments.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No comments yet. Be the first!</p>
          ) : (
            comments.map(comment => (
              <div key={comment.id} style={{ display: 'flex', gap: '15px' }}>
                <UserAvatar name={comment.user_name} src={comment.user_pic} size="small" />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: '600', color: 'var(--text-color)' }}>{comment.user_name}</span>
                      {comment.rating > 0 && <StarRating value={comment.rating} readonly />}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                      {currentUser && currentUser.id === comment.user_id && (
                        <button onClick={() => handleDelete(comment.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }} title="Delete">
                          <i className="fas fa-trash-can"></i>
                        </button>
                      )}
                    </div>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', lineHeight: '1.5', fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>
                    {comment.text}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </section>
  );
};

export default Comments;