import { useState, useEffect } from 'react';
import { commentsApi } from '../services/api';
import UserAvatar from './UserAvatar';

const Comments = ({ itemId, itemType, currentUser }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPostings] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [itemId, itemType]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const response = await commentsApi.getComments(itemId, itemType);
      setComments(response.data);
    } catch (err) {
      console.error("Failed to fetch comments", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setPostings(true);
    try {
      const response = await commentsApi.postComment({
        item_id: itemId,
        item_type: itemType,
        text: newComment
      });
      setComments([response.data, ...comments]);
      setNewComment('');
    } catch (err) {
      alert("Failed to post comment. Please try again.");
    } finally {
      setPostings(false);
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await commentsApi.deleteComment(commentId);
      setComments(comments.filter(c => c.id !== commentId));
    } catch (err) {
      alert("Failed to delete comment.");
    }
  };

  return (
    <section style={{ marginTop: '50px', borderTop: '1px solid #222', paddingTop: '40px' }}>
      <h2 className="section-title">Discussion</h2>
      
      {currentUser ? (
        <form onSubmit={handleSubmit} style={{ marginBottom: '40px', background: '#1a1a1a', padding: '20px', borderRadius: '8px' }}>
          <div style={{ display: 'flex', gap: '15px' }}>
            <UserAvatar name={currentUser.name} src={currentUser.profile_pic} size="small" />
            <div style={{ flex: 1 }}>
              <textarea 
                className="form-input"
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                style={{ minHeight: '80px', marginBottom: '10px', resize: 'vertical' }}
                required
              ></textarea>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  type="submit" 
                  className="btn-auth" 
                  disabled={posting}
                  style={{ width: 'auto', padding: '8px 25px', marginTop: 0 }}
                >
                  {posting ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div style={{ padding: '20px', background: '#1a1a1a', borderRadius: '8px', textAlign: 'center', marginBottom: '40px' }}>
          <p style={{ color: '#888' }}>Please <a href="/login" style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>login</a> to join the discussion.</p>
        </div>
      )}

      {loading ? (
        <p>Loading comments...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          {comments.length === 0 ? (
            <p style={{ color: '#555', textAlign: 'center' }}>No comments yet. Be the first to share your thoughts!</p>
          ) : (
            comments.map(comment => (
              <div key={comment.id} style={{ display: 'flex', gap: '15px' }}>
                <UserAvatar name={comment.user_name} src={comment.user_pic} size="small" />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontWeight: '600', color: '#eee' }}>{comment.user_name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <span style={{ fontSize: '0.75rem', color: '#555' }}>
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                      {currentUser && currentUser.id === comment.user_id && (
                        <button 
                          onClick={() => handleDelete(comment.id)}
                          style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '0.8rem' }}
                          title="Delete Comment"
                        >
                          <i className="fas fa-trash-can"></i>
                        </button>
                      )}
                    </div>
                  </div>
                  <div style={{ color: '#ccc', lineHeight: '1.5', fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>
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
