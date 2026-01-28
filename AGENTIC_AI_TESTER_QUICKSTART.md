# Agentic AI Tester - Quick Start Guide
## 5D Character Creator V6 Testing

---

## 🎯 Your Mission

You are testing the **5D Character Creator**, an AI-powered character development tool for writers and storytellers. Your goal is to:

1. **Test all features systematically**
2. **Identify bugs and issues**
3. **Assess workflow quality**
4. **Suggest enhancements**
5. **Provide actionable feedback**

---

## 📚 Documents You Need

1. **AGENTIC_AI_TEST_PLAN.md** - Comprehensive test plan (your main guide)
2. **AGENTIC_AI_TEST_CHECKLIST.md** - Quick checklist for tracking
3. **This document** - Quick start reference

---

## ⚡ Quick Start (5 Minutes)

### Step 1: Setup (2 min)
```bash
cd 5d-character-creator-app/app
npm install
npm run dev
```
Open: `http://localhost:3000`

### Step 2: First Test (3 min)
1. Click "Chat" in sidebar
2. Select "Character Creator" mode
3. Type: `/generate basic`
4. Answer 5-7 questions
5. Verify character is created

**If this works → You're ready to test!**

---

## 🗺️ Testing Roadmap

### Phase 1: Critical Path (Start Here)
**Time: 30-45 minutes**

1. **Navigation & Setup**
   - [ ] App loads correctly
   - [ ] All navigation links work
   - [ ] Settings page accessible

2. **Character Creation**
   - [ ] Manual creation works
   - [ ] AI Basic mode works
   - [ ] AI Advanced mode works
   - [ ] Character saves correctly

3. **AI Chat Core**
   - [ ] Chat interface loads
   - [ ] Mode switching works
   - [ ] Entity linking works
   - [ ] JSON save blocks work

**✅ If all pass → Continue to Phase 2**

---

### Phase 2: Core Features
**Time: 45-60 minutes**

1. **World Building**
   - [ ] World creation works
   - [ ] World-character linking works

2. **Project Management**
   - [ ] Project creation works
   - [ ] Document system works

3. **Data Management**
   - [ ] Export works
   - [ ] Trash/recovery works

---

### Phase 3: Advanced Features
**Time: 30-45 minutes**

1. **Analysis Tools**
2. **Image Generation**
3. **History/Sessions**
4. **Advanced Chat Modes**

---

## 🔍 What to Look For

### ✅ Good Signs
- Smooth workflows
- Clear UI/UX
- Helpful AI responses
- Data persists correctly
- No console errors
- Fast performance

### ⚠️ Red Flags
- Console errors
- Data loss
- Broken links/navigation
- Confusing workflows
- Slow performance
- Missing features

---

## 📝 How to Document Findings

### For Bugs:
```
**Bug:** [Brief description]
**Location:** [Section/Page]
**Severity:** [Critical/High/Medium/Low]
**Steps:** 1. ... 2. ... 3. ...
**Expected:** [What should happen]
**Actual:** [What happens]
```

### For Enhancements:
```
**Enhancement:** [Brief description]
**Priority:** [High/Medium/Low]
**Benefit:** [Why this helps]
**Current State:** [How it works now]
**Proposed:** [What should change]
```

### For Workflows:
```
**Workflow:** [Name]
**Rating:** [1-5]
**Strengths:** [What works well]
**Weaknesses:** [What needs improvement]
**Suggestions:** [How to improve]
```

---

## 🎯 Key Testing Areas

### 1. Character Development Flow
**Test the complete journey:**
- Start with concept → Use AI → Develop through phases → Link to world → Export

### 2. AI Chat Interaction
**Test AI capabilities:**
- Mode selection → Entity linking → Conversation → Save suggestions → Apply updates

### 3. Entity Relationships
**Test linking system:**
- Create character → Create world → Link them → Create project → Link both → Verify context

### 4. Data Persistence
**Test data reliability:**
- Create content → Refresh page → Verify data still exists → Test export → Test import (if available)

---

## 🚨 Critical Issues to Report Immediately

1. **Data Loss** - Any situation where user data is lost
2. **App Crashes** - Application becomes unusable
3. **Security Issues** - API keys exposed, data leaks
4. **Core Feature Broken** - Character creation, chat, or saving doesn't work
5. **Performance Issues** - App is too slow to use

---

## 💡 Enhancement Priority Guide

### High Priority
- Fixes broken workflows
- Adds missing critical features
- Improves core user experience
- Solves data loss issues

### Medium Priority
- Improves existing features
- Adds quality-of-life improvements
- Enhances workflow efficiency
- Better error handling

### Low Priority
- Nice-to-have features
- UI polish
- Minor optimizations
- Documentation improvements

---

## 📊 Quick Assessment Framework

### Rate Each Area (1-5):
- **1** = Broken/Unusable
- **2** = Major Issues
- **3** = Works but needs improvement
- **4** = Good, minor issues
- **5** = Excellent

### Areas to Rate:
- [ ] Overall UI/UX
- [ ] Character Creation
- [ ] AI Chat Quality
- [ ] World Building
- [ ] Project Management
- [ ] Data Persistence
- [ ] Performance
- [ ] Error Handling

---

## 🔄 Testing Workflow

### For Each Feature:
1. **Understand** - Read what it should do
2. **Test** - Try it out
3. **Verify** - Check if it works correctly
4. **Document** - Record findings
5. **Move On** - Don't get stuck

### For Each Bug:
1. **Reproduce** - Can you make it happen again?
2. **Isolate** - What causes it?
3. **Document** - Write it down clearly
4. **Prioritize** - How severe is it?

---

## 📋 Quick Command Reference

### Character Creation
- `/generate basic` - Quick character (5-7 questions)
- `/generate advanced` - Full 5-phase character

### World Building
- `/worldbio` - Create world

### General
- `/menu` - Show commands
- `/help [command]` - Get help
- `/progress` - View progress
- `/save` - Save current state

---

## ✅ Completion Checklist

Before finishing, ensure you have:

- [ ] Tested all critical paths
- [ ] Documented all bugs found
- [ ] Suggested key enhancements
- [ ] Rated all workflows
- [ ] Provided overall assessment
- [ ] Completed test checklist
- [ ] Written summary report

---

## 🎓 Tips for Effective Testing

1. **Think Like a User** - Not just a technical tester
2. **Be Systematic** - Follow the test plan
3. **Document Clearly** - Your findings guide development
4. **Prioritize** - Focus on critical issues first
5. **Be Constructive** - Provide actionable feedback
6. **Test Real Scenarios** - Use realistic use cases
7. **Check Edge Cases** - But don't get stuck on them
8. **Verify Fixes** - If testing multiple rounds

---

## 📞 When You're Stuck

### If Something Doesn't Work:
1. Check browser console for errors
2. Verify API keys are set (if needed)
3. Try refreshing the page
4. Check if it's a known issue
5. Document the issue clearly

### If You're Unsure:
- Document what you observed
- Note your uncertainty
- Suggest further investigation
- Don't guess - be honest

---

## 🎯 Success Criteria

### Your Testing is Successful If:
- ✅ All critical paths are tested
- ✅ Major bugs are identified
- ✅ Workflow issues are documented
- ✅ Enhancement suggestions are provided
- ✅ Assessment is clear and actionable
- ✅ Report is comprehensive

---

## 🚀 Ready to Start?

1. ✅ Read the main test plan (AGENTIC_AI_TEST_PLAN.md)
2. ✅ Open the checklist (AGENTIC_AI_TEST_CHECKLIST.md)
3. ✅ Start the application
4. ✅ Begin with Phase 1: Critical Path
5. ✅ Document everything as you go

**Good luck! Your thorough testing will help make this app better! 🎉**

---

**Questions?** Refer to the main test plan document for detailed instructions.

**Time Estimate:** 2-4 hours for comprehensive testing

**Priority:** Focus on critical paths first, then expand based on time available.
